export declare class Verify2faDto {
    tempToken: string;
    totpCode: string;
}
export declare class Verify2faResponseDto {
    success: boolean;
    accessToken?: string;
    message?: string;
}
