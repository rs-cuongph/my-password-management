import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sodium from 'libsodium-wrappers';
import {
  RecoveryCode,
  GenerateRecoveryCodeResult,
  RecoveryCodeWrappedDEK,
  RecoveryKeyDerivation
} from '../interfaces/recovery-code.interface';

@Injectable()
export class RecoveryCodeService {
  private readonly logger = new Logger(RecoveryCodeService.name);
  private sodium: typeof sodium | null = null;

  // Recovery code configuration
  private static readonly RECOVERY_CODE_LENGTH = 32; // 32 characters
  private static readonly RECOVERY_CODE_GROUPS = 4; // 4 groups of 8 chars
  private static readonly RECOVERY_SALT_SIZE = 32; // 256 bits
  private static readonly NONCE_SIZE = 24; // XChaCha20-Poly1305 nonce size
  private static readonly CURRENT_VERSION = 1;

  constructor(private readonly configService: ConfigService) {
    this.initializeSodium();
  }

  private async initializeSodium(): Promise<void> {
    try {
      await sodium.ready;
      this.sodium = sodium;
      this.logger.log('Sodium library initialized for recovery codes');
    } catch (error) {
      this.logger.error('Failed to initialize sodium library', error);
      throw error;
    }
  }

  private async ensureSodiumReady(): Promise<void> {
    if (!this.sodium) {
      await this.initializeSodium();
    }
  }

  /**
   * Generate a cryptographically secure recovery code
   * Format: XXXX-XXXX-XXXX-XXXX (32 chars total, excluding hyphens)
   */
  async generateRecoveryCode(): Promise<RecoveryCode> {
    await this.ensureSodiumReady();

    try {
      // Generate 20 bytes of random data (160 bits)
      const randomBytes = this.sodium!.randombytes_buf(20);

      // Convert to base32 (no padding) for better readability
      // Base32 uses 5 bits per character, so 160 bits = 32 characters
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let result = '';

      // Convert bytes to base32
      let buffer = 0;
      let bitsLeft = 0;

      for (const byte of randomBytes) {
        buffer = (buffer << 8) | byte;
        bitsLeft += 8;

        while (bitsLeft >= 5) {
          result += base32Chars[(buffer >> (bitsLeft - 5)) & 31];
          bitsLeft -= 5;
        }
      }

      // Handle remaining bits
      if (bitsLeft > 0) {
        result += base32Chars[(buffer << (5 - bitsLeft)) & 31];
      }

      // Take exactly 32 characters and format with hyphens
      const code = result.substring(0, 32);
      const formattedCode = `${code.substring(0, 8)}-${code.substring(8, 16)}-${code.substring(16, 24)}-${code.substring(24, 32)}`;

      // Generate recovery salt for key derivation
      const recoverySalt = this.sodium!.randombytes_buf(RecoveryCodeService.RECOVERY_SALT_SIZE);

      this.logger.log('Recovery code generated successfully');

      return {
        code: formattedCode,
        rawCode: code, // Without hyphens for cryptographic operations
        salt: Buffer.from(recoverySalt).toString('base64'),
        createdAt: new Date(),
        version: RecoveryCodeService.CURRENT_VERSION
      };
    } catch (error) {
      this.logger.error('Failed to generate recovery code', error);
      throw new Error('Recovery code generation failed');
    }
  }

  /**
   * Derive recovery key from recovery code using Argon2id
   */
  async deriveRecoveryKey(
    recoveryCode: string,
    salt: string,
    params?: RecoveryKeyDerivation
  ): Promise<Uint8Array> {
    await this.ensureSodiumReady();

    try {
      // Remove hyphens from recovery code
      const cleanCode = recoveryCode.replace(/-/g, '');

      // Validate recovery code format
      if (cleanCode.length !== 32 || !/^[A-Z2-7]+$/.test(cleanCode)) {
        throw new Error('Invalid recovery code format');
      }

      const saltBuffer = Buffer.from(salt, 'base64');
      const password = Buffer.from(cleanCode, 'utf8');

      const derivationParams = {
        opsLimit: params?.opsLimit || this.sodium!.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        memLimit: params?.memLimit || this.sodium!.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        algorithm: params?.algorithm || this.sodium!.crypto_pwhash_ALG_ARGON2ID13,
        ...params
      };

      const derivedKey = this.sodium!.crypto_pwhash(
        32, // 256-bit key
        password,
        saltBuffer,
        derivationParams.opsLimit,
        derivationParams.memLimit,
        derivationParams.algorithm
      );

      this.logger.log('Recovery key derived successfully');
      return derivedKey;
    } catch (error) {
      this.logger.error('Failed to derive recovery key', error);
      throw new Error('Recovery key derivation failed');
    }
  }

  /**
   * Wrap DEK with recovery key (bypass master password)
   */
  async wrapDEKWithRecoveryKey(
    dek: Uint8Array,
    recoveryKey: Uint8Array
  ): Promise<RecoveryCodeWrappedDEK> {
    await this.ensureSodiumReady();

    try {
      // Generate random nonce
      const nonce = this.sodium!.randombytes_buf(RecoveryCodeService.NONCE_SIZE);

      // Encrypt DEK using XChaCha20-Poly1305
      const ciphertext = this.sodium!.crypto_aead_xchacha20poly1305_ietf_encrypt(
        dek,
        null, // No additional data
        null, // No secret nonce
        nonce,
        recoveryKey
      );

      // Split ciphertext and tag
      const encryptedDEK = ciphertext.slice(0, -16);
      const tag = ciphertext.slice(-16);

      const wrappedDEK: RecoveryCodeWrappedDEK = {
        encryptedDEK: Buffer.from(encryptedDEK).toString('base64'),
        nonce: Buffer.from(nonce).toString('base64'),
        tag: Buffer.from(tag).toString('base64'),
        metadata: {
          version: RecoveryCodeService.CURRENT_VERSION,
          createdAt: new Date(),
          algorithm: 'xchacha20-poly1305',
          purpose: 'recovery'
        }
      };

      this.logger.log('DEK wrapped with recovery key successfully');
      return wrappedDEK;
    } catch (error) {
      this.logger.error('Failed to wrap DEK with recovery key', error);
      throw new Error('DEK wrapping with recovery key failed');
    } finally {
      // Clear recovery key from memory
      if (recoveryKey) {
        this.clearMemory([recoveryKey]);
      }
    }
  }

  /**
   * Unwrap DEK using recovery key
   */
  async unwrapDEKWithRecoveryKey(
    wrappedDEK: RecoveryCodeWrappedDEK,
    recoveryKey: Uint8Array
  ): Promise<{ dek: Uint8Array; success: boolean }> {
    await this.ensureSodiumReady();

    try {
      // Validate wrapped DEK
      if (!wrappedDEK.encryptedDEK || !wrappedDEK.nonce || !wrappedDEK.tag) {
        throw new Error('Invalid wrapped DEK format');
      }

      // Decode components
      const encryptedDEK = Buffer.from(wrappedDEK.encryptedDEK, 'base64');
      const nonce = Buffer.from(wrappedDEK.nonce, 'base64');
      const tag = Buffer.from(wrappedDEK.tag, 'base64');

      // Reconstruct ciphertext (encrypted data + tag)
      const ciphertext = new Uint8Array(encryptedDEK.length + tag.length);
      ciphertext.set(encryptedDEK, 0);
      ciphertext.set(tag, encryptedDEK.length);

      // Decrypt DEK
      const dek = this.sodium!.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // No secret nonce
        ciphertext,
        null, // No additional data
        nonce,
        recoveryKey
      );

      if (!dek) {
        throw new Error('Decryption failed - invalid recovery key or corrupted data');
      }

      this.logger.log('DEK unwrapped with recovery key successfully');
      return { dek, success: true };
    } catch (error) {
      this.logger.error('Failed to unwrap DEK with recovery key', error);
      return { dek: new Uint8Array(), success: false };
    } finally {
      // Clear recovery key from memory
      if (recoveryKey) {
        this.clearMemory([recoveryKey]);
      }
    }
  }

  /**
   * Generate complete recovery code system (code + wrapped DEK)
   */
  async generateRecoveryCodeForDEK(dek: Uint8Array): Promise<GenerateRecoveryCodeResult> {
    try {
      // Generate recovery code and salt
      const recoveryCode = await this.generateRecoveryCode();

      // Derive recovery key from recovery code
      const recoveryKey = await this.deriveRecoveryKey(
        recoveryCode.code,
        recoveryCode.salt
      );

      // Wrap DEK with recovery key
      const wrappedDEK = await this.wrapDEKWithRecoveryKey(dek, recoveryKey);

      this.logger.log('Complete recovery code system generated');

      return {
        recoveryCode,
        wrappedDEK,
        instructions: [
          'Store this recovery code in a secure location separate from your password',
          'This code can be used to access your vault if you forget your master password',
          'Never share this recovery code with anyone',
          'Consider storing it offline (written down) in a secure place',
          'If this code is compromised, generate a new one immediately'
        ]
      };
    } catch (error) {
      this.logger.error('Failed to generate recovery code system for DEK', error);
      throw new Error('Recovery code system generation failed');
    }
  }

  /**
   * Verify recovery code format and derive key (for validation)
   */
  async validateRecoveryCode(
    recoveryCode: string,
    salt: string
  ): Promise<{ valid: boolean; key?: Uint8Array }> {
    try {
      const recoveryKey = await this.deriveRecoveryKey(recoveryCode, salt);
      return { valid: true, key: recoveryKey };
    } catch (error) {
      this.logger.warn('Recovery code validation failed', error.message);
      return { valid: false };
    }
  }

  /**
   * Clear sensitive data from memory
   */
  private clearMemory(buffers: Uint8Array[]): void {
    for (const buffer of buffers) {
      if (buffer && buffer.length > 0) {
        // Multiple clearing passes
        this.sodium!.memzero(buffer); // Zero first
        // Fill with random data
        const random = this.sodium!.randombytes_buf(buffer.length);
        buffer.set(random);
        // Zero again
        this.sodium!.memzero(buffer);
      }
    }
  }
}