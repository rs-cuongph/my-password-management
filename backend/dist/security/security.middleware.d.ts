import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from './security.service';
export declare class SecurityMiddleware implements NestMiddleware {
    private securityService;
    private readonly logger;
    constructor(securityService: SecurityService);
    use(req: Request, res: Response, next: NextFunction): void;
    private logSecurityEvent;
    private isSuspiciousRequest;
    private addSecurityHeaders;
    private sanitizeRequest;
    private sanitizeObject;
    private sanitizeString;
}
