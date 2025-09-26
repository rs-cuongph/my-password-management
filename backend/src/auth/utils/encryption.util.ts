import * as crypto from 'crypto';

export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Generate a random encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Encrypt data using AES-GCM
   * @param data - Data to encrypt
   * @param key - Encryption key (hex string)
   * @returns Encrypted data with IV and tag (base64 encoded)
   */
  static encrypt(data: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
      cipher.setAAD(Buffer.from('totp-secret', 'utf8'));

      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const tag = cipher.getAuthTag();

      // Combine IV + tag + encrypted data
      const combined = Buffer.concat([
        iv,
        tag,
        Buffer.from(encrypted, 'base64'),
      ]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param encryptedData - Encrypted data (base64 encoded)
   * @param key - Decryption key (hex string)
   * @returns Decrypted data
   */
  static decrypt(encryptedData: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract IV, tag, and encrypted data
      const iv = combined.subarray(0, this.IV_LENGTH);
      const tag = combined.subarray(
        this.IV_LENGTH,
        this.IV_LENGTH + this.TAG_LENGTH,
      );
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
      decipher.setAAD(Buffer.from('totp-secret', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a server key for TOTP secret encryption
   * This should be stored securely in environment variables
   */
  static generateServerKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }
}
