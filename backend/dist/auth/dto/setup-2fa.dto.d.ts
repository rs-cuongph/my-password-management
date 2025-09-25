export declare class Setup2faDto {
    tempToken: string;
}
export declare class Setup2faResponseDto {
    success: boolean;
    otpauthUri: string;
    qrCode?: string;
    message?: string;
}
