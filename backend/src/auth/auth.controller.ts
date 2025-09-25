import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { Setup2faDto, Setup2faResponseDto } from './dto/setup-2fa.dto';
import { Verify2faDto, Verify2faResponseDto } from './dto/verify-2fa.dto';
import { Public } from './decorators/public.decorator';
import { SensitiveRateLimit, StrictRateLimit } from '../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes per IP
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute per IP
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('setup-2fa')
  @HttpCode(HttpStatus.OK)
  @StrictRateLimit() // 3 attempts per 15 minutes
  async setup2fa(@Body() setup2faDto: Setup2faDto): Promise<Setup2faResponseDto> {
    return this.authService.setup2fa(setup2faDto);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @SensitiveRateLimit() // 5 attempts per 15 minutes
  async verify2fa(@Body() verify2faDto: Verify2faDto): Promise<Verify2faResponseDto> {
    return this.authService.verify2fa(verify2faDto);
  }
}
