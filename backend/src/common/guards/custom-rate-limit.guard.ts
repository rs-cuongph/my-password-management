import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';

@Injectable()
export class CustomRateLimitGuard {
  private readonly requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.getAllAndOverride(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rateLimitConfig) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest();
    const clientIp = this.getClientIp(request);
    const key = `${clientIp}:${request.route?.path || request.url}`;

    const now = Date.now();
    const { count, resetTime } = this.requestCounts.get(key) || {
      count: 0,
      resetTime: now + rateLimitConfig.ttl,
    };

    // Reset counter if time window has passed
    if (now > resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + rateLimitConfig.ttl,
      });
      return true;
    }

    // Check if limit exceeded
    if (count >= rateLimitConfig.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${rateLimitConfig.limit} requests per ${rateLimitConfig.ttl / 1000} seconds.`,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    this.requestCounts.set(key, { count: count + 1, resetTime });
    return true;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
