import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { username, email, password } = registerDto;

    // Check if username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
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
        kdfSalt
      }
    });

    return {
      userId: user.id,
      kdfSalt: user.kdfSalt
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    try {
      // Find user by username
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.isActive) {
        this.logger.warn(`Failed login attempt for username: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        this.logger.warn(`Invalid password for username: ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Log successful authentication
      this.logger.log(`User ${username} authenticated successfully`);

      // Generate temporary token for successful authentication
      const payload = {
        sub: user.id,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
        type: 'temp',
      };

      const tempToken = this.jwtService.sign(payload, { expiresIn: '15m' });

      return {
        success: true,
        tempToken,
        need2fa: user.need2fa,
        kdfSalt: user.kdfSalt,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Login error for username ${username}:`, error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateUser(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          need2fa: true,
        },
      });

      return user?.isActive ? user : null;
    } catch (error) {
      this.logger.error('Error validating user:', error);
      return null;
    }
  }
}
