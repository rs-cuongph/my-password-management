import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    sensitiveMax: parseInt(process.env.RATE_LIMIT_SENSITIVE_MAX || '5', 10),
    sensitiveWindow: parseInt(process.env.RATE_LIMIT_SENSITIVE_WINDOW || '900000', 10),
  },
  totp: {
    issuer: process.env.TOTP_ISSUER || 'VibeKanban',
    algorithm: process.env.TOTP_ALGORITHM || 'SHA1',
    digits: parseInt(process.env.TOTP_DIGITS || '6', 10),
    period: parseInt(process.env.TOTP_PERIOD || '30', 10),
  },
}));