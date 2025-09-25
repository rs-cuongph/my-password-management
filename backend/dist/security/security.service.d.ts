import { ConfigService } from '@nestjs/config';
export declare class SecurityService {
    private configService;
    constructor(configService: ConfigService);
    getCorsConfig(): {
        origin: boolean | string[];
        methods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
    };
    getHelmetConfig(): {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                styleSrc: string[];
                scriptSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                fontSrc: string[];
                objectSrc: string[];
                mediaSrc: string[];
                frameSrc: string[];
            };
        };
        crossOriginEmbedderPolicy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
    };
    getRateLimitConfig(): {
        windowMs: number;
        max: number;
        message: {
            error: string;
            statusCode: number;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    getSensitiveEndpointRateLimit(): {
        windowMs: number;
        max: number;
        message: {
            error: string;
            statusCode: number;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
}
