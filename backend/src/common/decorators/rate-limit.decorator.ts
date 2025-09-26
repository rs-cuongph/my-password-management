import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (limit: number, ttl: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttl });

// Predefined rate limits for common scenarios
export const SensitiveRateLimit = () => RateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const AuthRateLimit = () => RateLimit(10, 15 * 60 * 1000); // 10 requests per 15 minutes
export const StrictRateLimit = () => RateLimit(3, 15 * 60 * 1000); // 3 requests per 15 minutes
