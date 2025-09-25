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
exports.CustomRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limit_decorator_1 = require("../decorators/rate-limit.decorator");
let CustomRateLimitGuard = class CustomRateLimitGuard {
    reflector;
    requestCounts = new Map();
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const rateLimitConfig = this.reflector.getAllAndOverride(rate_limit_decorator_1.RATE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!rateLimitConfig) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const clientIp = this.getClientIp(request);
        const key = `${clientIp}:${request.route?.path || request.url}`;
        const now = Date.now();
        const { count, resetTime } = this.requestCounts.get(key) || { count: 0, resetTime: now + rateLimitConfig.ttl };
        if (now > resetTime) {
            this.requestCounts.set(key, { count: 1, resetTime: now + rateLimitConfig.ttl });
            return true;
        }
        if (count >= rateLimitConfig.limit) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Maximum ${rateLimitConfig.limit} requests per ${rateLimitConfig.ttl / 1000} seconds.`,
                retryAfter: Math.ceil((resetTime - now) / 1000),
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        this.requestCounts.set(key, { count: count + 1, resetTime });
        return true;
    }
    getClientIp(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            request.ip ||
            'unknown');
    }
};
exports.CustomRateLimitGuard = CustomRateLimitGuard;
exports.CustomRateLimitGuard = CustomRateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CustomRateLimitGuard);
//# sourceMappingURL=custom-rate-limit.guard.js.map