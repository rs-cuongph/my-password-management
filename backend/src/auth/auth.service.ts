import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { username, email, password } = registerDto;

    // Check if username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username đã tồn tại');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    // Generate random kdfSalt for client-side key derivation
    const kdfSalt = crypto.randomBytes(32).toString('hex');

    // Hash password for server authentication
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
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
    const { username, password } = loginDto;

    try {
      // Find user by username
      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
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
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password as string,
      );
      if (!isPasswordValid) {
        return {
          success: false,
          need2fa: false,
          kdfSalt: '',
          message: invalidCredentialsMessage,
        } as LoginResponseDto;
      }

      // Generate temporary token for session (valid for 15 minutes)
      const tempTokenPayload = {
        sub: user.id,
        username: user.username,
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
}
