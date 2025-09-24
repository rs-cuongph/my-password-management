import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

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
