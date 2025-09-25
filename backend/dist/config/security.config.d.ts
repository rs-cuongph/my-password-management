declare const _default: (() => {
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        enabled: boolean;
        origins: string[];
    };
    bcrypt: {
        rounds: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        sensitiveMax: number;
        sensitiveWindow: number;
    };
    totp: {
        issuer: string;
        algorithm: string;
        digits: number;
        period: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        enabled: boolean;
        origins: string[];
    };
    bcrypt: {
        rounds: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        sensitiveMax: number;
        sensitiveWindow: number;
    };
    totp: {
        issuer: string;
        algorithm: string;
        digits: number;
        period: number;
    };
}>;
export default _default;
