import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class CustomRateLimitGuard {
    private reflector;
    private readonly requestCounts;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
}
