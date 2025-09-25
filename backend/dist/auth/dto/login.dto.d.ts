export declare class LoginDto {
    username: string;
    password: string;
}
export declare class LoginResponseDto {
    success: boolean;
    tempToken?: string;
    need2fa: boolean;
    kdfSalt: string;
    message?: string;
}
