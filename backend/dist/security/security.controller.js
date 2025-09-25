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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const rate_limit_decorator_1 = require("../common/decorators/rate-limit.decorator");
let SecurityController = class SecurityController {
    testSecurity() {
        return {
            message: 'Security middleware is working',
            timestamp: new Date().toISOString(),
        };
    }
    testSensitiveEndpoint(data) {
        return {
            message: 'Sensitive endpoint accessed',
            data: data,
            timestamp: new Date().toISOString(),
        };
    }
    testProtectedEndpoint() {
        return {
            message: 'Protected endpoint accessed',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, common_1.Get)('test'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecurityController.prototype, "testSecurity", null);
__decorate([
    (0, common_1.Post)('sensitive'),
    (0, rate_limit_decorator_1.SensitiveRateLimit)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SecurityController.prototype, "testSensitiveEndpoint", null);
__decorate([
    (0, common_1.Get)('protected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecurityController.prototype, "testProtectedEndpoint", null);
exports.SecurityController = SecurityController = __decorate([
    (0, common_1.Controller)('security')
], SecurityController);
//# sourceMappingURL=security.controller.js.map