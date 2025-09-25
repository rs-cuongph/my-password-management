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

    // Sanitize request data
    this.sanitizeRequest(req);

    next();
  }

  private logSecurityEvent(req: Request) {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    
    // Log suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn(`Suspicious request detected: ${method} ${url} from ${ip} - User-Agent: ${userAgent}`);
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

    return suspiciousPatterns.some(pattern => 
      pattern.test(url) || pattern.test(userAgent)
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
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  private sanitizeRequest(req: Request) {
    // Remove potentially dangerous headers
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-forwarded-proto'];
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = this.sanitizeString(req.query[key] as string);
        }
      });
    }

    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      this.sanitizeObject(req.body);
    }
  }

  private sanitizeObject(obj: any) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = this.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        this.sanitizeObject(obj[key]);
      }
    });
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  }
}