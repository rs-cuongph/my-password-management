export declare const RATE_LIMIT_KEY = "rateLimit";
export declare const RateLimit: (limit: number, ttl: number) => import("@nestjs/common").CustomDecorator<string>;
export declare const SensitiveRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const AuthRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StrictRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
