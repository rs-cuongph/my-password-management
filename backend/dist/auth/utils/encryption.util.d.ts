export declare class EncryptionUtil {
    private static readonly ALGORITHM;
    private static readonly KEY_LENGTH;
    private static readonly IV_LENGTH;
    private static readonly TAG_LENGTH;
    static generateKey(): string;
    static encrypt(data: string, key: string): string;
    static decrypt(encryptedData: string, key: string): string;
    static generateServerKey(): string;
}
