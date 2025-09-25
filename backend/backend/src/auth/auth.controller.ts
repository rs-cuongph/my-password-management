import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      // Validate input
      if (!loginDto.username?.trim() || !loginDto.password) {
        throw new BadRequestException('Username and password are required');
      }

      const result = await this.authService.login(loginDto);

      this.logger.log(
        `Login attempt for username: ${loginDto.username} - ${result.success ? 'SUCCESS' : 'FAILED'}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Login error for username: ${loginDto.username}`,
        error,
      );

      // Return consistent error response for security
      return {
        success: false,
        need2fa: false,
        kdfSalt: '',
        message:
          error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}
