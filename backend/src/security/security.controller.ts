import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SensitiveRateLimit } from '../common/decorators/rate-limit.decorator';

@Controller('security')
export class SecurityController {
  
  @Get('test')
  @Public()
  testSecurity() {
    return {
      message: 'Security middleware is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('sensitive')
  @SensitiveRateLimit()
  testSensitiveEndpoint(@Body() data: any) {
    return {
      message: 'Sensitive endpoint accessed',
      data: data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('protected')
  testProtectedEndpoint() {
    return {
      message: 'Protected endpoint accessed',
      timestamp: new Date().toISOString(),
    };
  }
}