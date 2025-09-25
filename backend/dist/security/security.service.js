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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityService = class SecurityService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getCorsConfig() {
        const allowedOrigins = this.configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'];
        const isDevelopment = this.configService.get('NODE_ENV') === 'development';
        return {
            origin: isDevelopment ? true : allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Key',
            ],
            credentials: true,
            maxAge: 86400,
        };
    }
    getHelmetConfig() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        };
    }
    getRateLimitConfig() {
        return {
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                statusCode: 429,
            },
            standardHeaders: true,
            legacyHeaders: false,
        };
    }
    getSensitiveEndpointRateLimit() {
        return {
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: {
                error: 'Too many attempts for this sensitive operation, please try again later.',
                statusCode: 429,
            },
            standardHeaders: true,
            legacyHeaders: false,
        };
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map