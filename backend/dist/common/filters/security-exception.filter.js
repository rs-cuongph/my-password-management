"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SecurityExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let SecurityExceptionFilter = SecurityExceptionFilter_1 = class SecurityExceptionFilter {
    logger = new common_1.Logger(SecurityExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                message = exceptionResponse.message || exception.message;
                errorCode = exceptionResponse.error || 'HTTP_EXCEPTION';
            }
            else {
                message = exception.message;
                errorCode = 'HTTP_EXCEPTION';
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = this.handlePrismaError(exception);
            errorCode = 'DATABASE_ERROR';
        }
        else if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided';
            errorCode = 'VALIDATION_ERROR';
        }
        else if (exception instanceof Error) {
            if (process.env.NODE_ENV === 'production') {
                message = 'An unexpected error occurred';
                errorCode = 'INTERNAL_ERROR';
            }
            else {
                message = exception.message;
                errorCode = 'ERROR';
            }
        }
        this.logError(exception, request, status);
        const errorResponse = {
            statusCode: status,
            error: errorCode,
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (request.headers['x-request-id']) {
            errorResponse['requestId'] = request.headers['x-request-id'];
        }
        response.status(status).json(errorResponse);
    }
    handlePrismaError(error) {
        switch (error.code) {
            case 'P2002':
                return 'A record with this information already exists';
            case 'P2025':
                return 'Record not found';
            case 'P2003':
                return 'Invalid reference to related record';
            case 'P2014':
                return 'Invalid relation data';
            default:
                return 'Database operation failed';
        }
    }
    logError(exception, request, status) {
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'Unknown';
        if (status >= 500) {
            this.logger.error(`Server Error: ${method} ${url} - ${status} - IP: ${ip} - User-Agent: ${userAgent}`, exception instanceof Error ? exception.stack : exception);
        }
        else if (status >= 400) {
            this.logger.warn(`Client Error: ${method} ${url} - ${status} - IP: ${ip} - User-Agent: ${userAgent}`);
        }
    }
};
exports.SecurityExceptionFilter = SecurityExceptionFilter;
exports.SecurityExceptionFilter = SecurityExceptionFilter = SecurityExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], SecurityExceptionFilter);
//# sourceMappingURL=security-exception.filter.js.map