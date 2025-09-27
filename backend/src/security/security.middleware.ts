import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from './security.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(private securityService: SecurityService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Log security-relevant requests
    this.logSecurityEvent(req);

    // Add security headers
    this.addSecurityHeaders(res);

    next();
  }

  private logSecurityEvent(req: Request) {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';

    // Log suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn(
        `Suspicious request detected: ${method} ${url} from ${ip} - User-Agent: ${userAgent}`,
      );
    }

    // Log authentication attempts
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      this.logger.log(`Authentication attempt: ${method} ${url} from ${ip}`);
    }
  }

  private isSuspiciousRequest(req: Request): boolean {
    const { url, headers } = req;
    const userAgent = headers['user-agent'] || '';

    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /on\w+\s*=/i, // Event handler injection
    ];

    return suspiciousPatterns.some(
      (pattern) => pattern.test(url) || pattern.test(userAgent),
    );
  }

  private addSecurityHeaders(res: Response) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );
  }
}
