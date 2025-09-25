export declare class SecurityController {
    testSecurity(): {
        message: string;
        timestamp: string;
    };
    testSensitiveEndpoint(data: any): {
        message: string;
        data: any;
        timestamp: string;
    };
    testProtectedEndpoint(): {
        message: string;
        timestamp: string;
    };
}
