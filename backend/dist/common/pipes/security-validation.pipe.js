"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
let SecurityValidationPipe = class SecurityValidationPipe {
    async transform(value, { metatype }) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const sanitizedValue = this.sanitizeInput(value);
        const object = (0, class_transformer_1.plainToClass)(metatype, sanitizedValue);
        const errors = await (0, class_validator_1.validate)(object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            disableErrorMessages: process.env.NODE_ENV === 'production',
        });
        if (errors.length > 0) {
            const errorMessages = errors.map(error => {
                const constraints = error.constraints;
                return constraints ? Object.values(constraints).join(', ') : 'Validation failed';
            });
            throw new common_1.BadRequestException({
                statusCode: 400,
                error: 'Validation Error',
                message: errorMessages,
            });
        }
        return object;
    }
    toValidate(metatype) {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
    sanitizeInput(value) {
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }
        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeInput(item));
        }
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    sanitized[key] = this.sanitizeInput(value[key]);
                }
            }
            return sanitized;
        }
        return value;
    }
    sanitizeString(str) {
        if (typeof str !== 'string')
            return str;
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
            .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/('|(\\')|(;)|(\-\-)|(\/\*)|(\*\/))/gi, '')
            .trim();
    }
};
exports.SecurityValidationPipe = SecurityValidationPipe;
exports.SecurityValidationPipe = SecurityValidationPipe = __decorate([
    (0, common_1.Injectable)()
], SecurityValidationPipe);
//# sourceMappingURL=security-validation.pipe.js.map