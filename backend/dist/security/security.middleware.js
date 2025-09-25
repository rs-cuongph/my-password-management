"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const security_service_1 = require("./security.service");
let SecurityMiddleware = SecurityMiddleware_1 = class SecurityMiddleware {
    securityService;
    logger = new common_1.Logger(SecurityMiddleware_1.name);
    constructor(securityService) {
        this.securityService = securityService;
    }
    use(req, res, next) {
        this.logSecurityEvent(req);
        this.addSecurityHeaders(res);
        this.sanitizeRequest(req);
        next();
    }
    logSecurityEvent(req) {
        const { method, url, ip, headers } = req;
        const userAgent = headers['user-agent'] || 'Unknown';
        if (this.isSuspiciousRequest(req)) {
            this.logger.warn(`Suspicious request detected: ${method} ${url} from ${ip} - User-Agent: ${userAgent}`);
        }
        if (url.includes('/auth/login') || url.includes('/auth/register')) {
            this.logger.log(`Authentication attempt: ${method} ${url} from ${ip}`);
        }
    }
    isSuspiciousRequest(req) {
        const { url, headers } = req;
        const userAgent = headers['user-agent'] || '';
        const suspiciousPatterns = [
            /\.\./,
            /<script/i,
            /union.*select/i,
            /javascript:/i,
            /on\w+\s*=/i,
        ];
        return suspiciousPatterns.some(pattern => pattern.test(url) || pattern.test(userAgent));
    }
    addSecurityHeaders(res) {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    }
    sanitizeRequest(req) {
        delete req.headers['x-forwarded-host'];
        delete req.headers['x-forwarded-proto'];
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = this.sanitizeString(req.query[key]);
                }
            });
        }
        if (req.body && typeof req.body === 'object') {
            this.sanitizeObject(req.body);
        }
    }
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null)
            return;
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = this.sanitizeString(obj[key]);
            }
            else if (typeof obj[key] === 'object') {
                this.sanitizeObject(obj[key]);
            }
        });
    }
    sanitizeString(str) {
        if (typeof str !== 'string')
            return str;
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = SecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_service_1.SecurityService])
], SecurityMiddleware);
//# sourceMappingURL=security.middleware.js.map