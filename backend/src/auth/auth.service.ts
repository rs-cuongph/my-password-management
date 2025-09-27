import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { Setup2faDto, Setup2faResponseDto } from './dto/setup-2fa.dto';
import { Verify2faDto, Verify2faResponseDto } from './dto/verify-2fa.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { EncryptionUtil } from './utils/encryption.util';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

interface JwtTokenPayload {
  sub: number;
  type?: string;
  exp: number;
  iat: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Generate random kdfSalt for client-side key derivation
    const kdfSalt = crypto.randomBytes(32).toString('hex');

    // Hash password for server authentication
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        kdfSalt,
      },
    });

    return {
      userId: user.id,
      kdfSalt: user.kdfSalt,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          kdfSalt: true,
          need2fa: true,
          isActive: true,
        },
      });

      // Generic error message for security
      const invalidCredentialsMessage =
        'Tên đăng nhập hoặc mật khẩu không chính xác';

      if (!user) {
        return {
          success: false,
          need2fa: false,
          kdfSalt: '',
          message: invalidCredentialsMessage,
        } as LoginResponseDto;
      }

      if (!user.isActive) {
        return {
          success: false,
          need2fa: false,
          kdfSalt: '',
          message: 'Tài khoản đã bị vô hiệu hóa',
        } as LoginResponseDto;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          need2fa: false,
          kdfSalt: '',
          message: invalidCredentialsMessage,
        } as LoginResponseDto;
      }

      // If user doesn't need 2FA, generate access token directly
      if (!user.need2fa) {
        const accessTokenPayload = {
          sub: user.id,
          email: user.email,
          type: 'access',
        };

        const accessToken = this.jwtService.sign(accessTokenPayload, {
          expiresIn: '1h',
        });

        return {
          success: true,
          accessToken,
          need2fa: false,
          kdfSalt: user.kdfSalt,
        } as LoginResponseDto;
      }

      // Generate temporary token for 2FA verification (valid for 15 minutes)
      const tempTokenPayload = {
        sub: user.id,
        email: user.email,
        type: 'temp',
      };

      const tempToken = this.jwtService.sign(tempTokenPayload, {
        expiresIn: '15m',
      });

      return {
        success: true,
        tempToken,
        need2fa: user.need2fa,
        kdfSalt: user.kdfSalt,
      } as LoginResponseDto;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log error for debugging but don't expose internal details
      console.error('Login error:', error);
      throw new BadRequestException('Đã xảy ra lỗi trong quá trình đăng nhập');
    }
  }

  async setup2fa(setup2faDto: Setup2faDto): Promise<Setup2faResponseDto> {
    const { tempToken } = setup2faDto;

    try {
      // Verify temp token
      const payload = this.jwtService.verify(tempToken);
      if ((payload as JwtTokenPayload).type !== 'temp') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: (payload as JwtTokenPayload).sub },
        select: { id: true, email: true, totpSecret: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if 2FA is already enabled
      if (user.totpSecret) {
        return {
          success: false,
          otpauthUri: '',
          message: '2FA đã được kích hoạt cho tài khoản này',
        };
      }

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Vibe Kanban (${user.email})`,
        issuer: 'Vibe Kanban',
        length: 32,
      });

      // Encrypt the secret
      const encryptionKey = this.configService.get<string>(
        'TOTP_ENCRYPTION_KEY',
      );
      if (!encryptionKey) {
        throw new BadRequestException('TOTP encryption key not configured');
      }

      const encryptedSecret = EncryptionUtil.encrypt(
        secret.base32,
        encryptionKey,
      );

      // Store encrypted secret in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: encryptedSecret },
      });

      // Generate QR code
      const qrCodeDataURL = secret.otpauth_url
        ? await QRCode.toDataURL(secret.otpauth_url)
        : undefined;

      return {
        success: true,
        otpauthUri: secret.otpauth_url!,
        qrCode: qrCodeDataURL as string,
        message: 'TOTP secret generated successfully',
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Setup 2FA error:', error);
      throw new BadRequestException(
        'Đã xảy ra lỗi trong quá trình thiết lập 2FA',
      );
    }
  }

  async verify2fa(verify2faDto: Verify2faDto): Promise<Verify2faResponseDto> {
    const { tempToken, totpCode } = verify2faDto;

    try {
      // Verify temp token
      const payload = this.jwtService.verify(tempToken);
      if ((payload as JwtTokenPayload).type !== 'temp') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user with encrypted TOTP secret
      const user = await this.prisma.user.findUnique({
        where: { id: (payload as JwtTokenPayload).sub },
        select: { id: true, email: true, totpSecret: true, kdfSalt: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.totpSecret) {
        throw new BadRequestException('2FA chưa được thiết lập');
      }

      // Decrypt TOTP secret
      const encryptionKey = this.configService.get<string>(
        'TOTP_ENCRYPTION_KEY',
      );
      if (!encryptionKey) {
        throw new BadRequestException('TOTP encryption key not configured');
      }

      const decryptedSecret = EncryptionUtil.decrypt(
        user.totpSecret,
        encryptionKey,
      );

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2, // Allow 2 time steps tolerance
      });

      if (!verified) {
        return {
          success: false,
          message: 'Mã TOTP không chính xác',
        };
      }

      // Enable 2FA and generate access token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { need2fa: true },
      });

      // Generate access token with 1 hour TTL
      const accessTokenPayload = {
        sub: user.id,
        email: user.email,
        type: 'access',
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: '1h',
      });

      return {
        success: true,
        accessToken,
        kdfSalt: user.kdfSalt,
        message: '2FA đã được kích hoạt thành công',
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Verify 2FA error:', error);
      throw new BadRequestException(
        'Đã xảy ra lỗi trong quá trình xác thực 2FA',
      );
    }
  }

  async verify2faLogin(
    verify2faDto: Verify2faDto,
  ): Promise<Verify2faResponseDto> {
    const { tempToken, totpCode } = verify2faDto;

    try {
      // Verify temp token
      const payload = this.jwtService.verify(tempToken);
      if ((payload as JwtTokenPayload).type !== 'temp') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user with encrypted TOTP secret
      const user = await this.prisma.user.findUnique({
        where: { id: (payload as JwtTokenPayload).sub },
        select: { id: true, email: true, totpSecret: true, kdfSalt: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.totpSecret) {
        throw new BadRequestException('2FA chưa được thiết lập');
      }

      // Decrypt TOTP secret
      const encryptionKey = this.configService.get<string>(
        'TOTP_ENCRYPTION_KEY',
      );
      if (!encryptionKey) {
        throw new BadRequestException('TOTP encryption key not configured');
      }

      const decryptedSecret = EncryptionUtil.decrypt(
        user.totpSecret,
        encryptionKey,
      );

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2, // Allow 2 time steps tolerance
      });

      if (!verified) {
        return {
          success: false,
          message: 'Mã TOTP không chính xác',
        };
      }

      // Generate access token for login
      const accessTokenPayload = {
        sub: user.id,
        email: user.email,
        type: 'access',
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: '1h',
      });

      return {
        success: true,
        accessToken,
        kdfSalt: user.kdfSalt,
        message: 'Đăng nhập thành công',
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Verify 2FA login error:', error);
      throw new BadRequestException(
        'Đã xảy ra lỗi trong quá trình xác thực 2FA',
      );
    }
  }

  async getUserProfile(userId: number): Promise<UserProfileDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          isActive: true,
          need2fa: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        need2fa: user.need2fa,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Get user profile error:', error);
      throw new BadRequestException(
        'Đã xảy ra lỗi khi lấy thông tin người dùng',
      );
    }
  }
}
