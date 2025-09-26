import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import _sodium from 'libsodium-wrappers';
import * as crypto from 'crypto';
import {
  IDEKService,
  DEKResult,
  WrappedDEK,
  DEKGenerationOptions,
  DEKWrapOptions,
  DEKUnwrapOptions,
  KeyRotationInfo,
  DEKMetadata,
} from '../interfaces/dek.interface';

@Injectable()
export class DEKService implements IDEKService {
  private sodium: typeof _sodium;
  private readonly DEK_SIZE = 32; // 256 bits
  private readonly NONCE_SIZE = 24; // XChaCha20 nonce size
  private readonly TAG_SIZE = 16; // Poly1305 tag size
  private readonly CURRENT_VERSION = 1;

  constructor(private configService: ConfigService) {
    this.initializeSodium();
  }

  private async initializeSodium(): Promise<void> {
    try {
      await _sodium.ready;
      this.sodium = _sodium;
    } catch (error) {
      throw new InternalServerErrorException('Failed to initialize libsodium');
    }
  }

  /**
   * Generate a new 256-bit DEK
   */
  async generateDEK(options: DEKGenerationOptions = {}): Promise<DEKResult> {
    await this.ensureSodiumReady();

    try {
      // Generate random 256-bit key
      const dek = this.sodium.randombytes_buf(this.DEK_SIZE);

      const metadata: DEKMetadata = {
        version: options.version || this.CURRENT_VERSION,
        createdAt: new Date(),
        algorithm: 'xchacha20-poly1305',
      };

      return {
        dek,
        metadata,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to generate DEK: ${error.message}`);
    }
  }

  /**
   * Wrap a DEK with a master key using XChaCha20-Poly1305
   */
  async wrapDEK(
    dek: Uint8Array,
    masterKey: Uint8Array,
    options: DEKWrapOptions = {},
  ): Promise<WrappedDEK> {
    await this.ensureSodiumReady();

    try {
      this.validateKeySize(dek, this.DEK_SIZE, 'DEK');
      this.validateKeySize(masterKey, this.DEK_SIZE, 'Master key');

      // Generate or use provided nonce
      const nonce = options.nonce || this.sodium.randombytes_buf(this.NONCE_SIZE);
      
      if (nonce.length !== this.NONCE_SIZE) {
        throw new BadRequestException(`Nonce must be ${this.NONCE_SIZE} bytes`);
      }

      // Prepare additional authenticated data
      const aad = options.aad ? Buffer.from(options.aad, 'utf8') : null;

      // Encrypt DEK using XChaCha20-Poly1305
      const encrypted = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        dek,
        aad,
        null, // nsec (not used)
        nonce,
        masterKey,
      );

      // Extract ciphertext and tag
      const ciphertext = encrypted.slice(0, -this.TAG_SIZE);
      const tag = encrypted.slice(-this.TAG_SIZE);

      const metadata: DEKMetadata = {
        version: options.version || this.CURRENT_VERSION,
        createdAt: new Date(),
        algorithm: 'xchacha20-poly1305',
      };

      return {
        encryptedDEK: Buffer.from(ciphertext).toString('base64'),
        nonce: Buffer.from(nonce).toString('base64'),
        tag: Buffer.from(tag).toString('base64'),
        metadata,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to wrap DEK: ${error.message}`);
    }
  }

  /**
   * Unwrap a DEK using the master key
   */
  async unwrapDEK(
    wrappedDEK: WrappedDEK,
    masterKey: Uint8Array,
    options: DEKUnwrapOptions = {},
  ): Promise<DEKResult> {
    await this.ensureSodiumReady();

    try {
      this.validateKeySize(masterKey, this.DEK_SIZE, 'Master key');

      // Decode components
      const encryptedDEK = Buffer.from(wrappedDEK.encryptedDEK, 'base64');
      const nonce = Buffer.from(wrappedDEK.nonce, 'base64');
      const tag = Buffer.from(wrappedDEK.tag, 'base64');

      // Validate sizes
      if (nonce.length !== this.NONCE_SIZE) {
        throw new BadRequestException(`Invalid nonce size: expected ${this.NONCE_SIZE}, got ${nonce.length}`);
      }
      if (tag.length !== this.TAG_SIZE) {
        throw new BadRequestException(`Invalid tag size: expected ${this.TAG_SIZE}, got ${tag.length}`);
      }

      // Prepare additional authenticated data
      const aad = options.aad ? Buffer.from(options.aad, 'utf8') : null;

      // Combine ciphertext and tag for decryption
      const ciphertextWithTag = new Uint8Array(encryptedDEK.length + tag.length);
      ciphertextWithTag.set(encryptedDEK);
      ciphertextWithTag.set(tag, encryptedDEK.length);

      // Decrypt DEK using XChaCha20-Poly1305
      const decrypted = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // nsec (not used)
        ciphertextWithTag,
        aad,
        nonce,
        masterKey,
      );

      if (!decrypted) {
        throw new BadRequestException('Failed to decrypt DEK: invalid key or corrupted data');
      }

      return {
        dek: decrypted,
        metadata: {
          ...wrappedDEK.metadata,
          createdAt: new Date(wrappedDEK.metadata.createdAt),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to unwrap DEK: ${error.message}`);
    }
  }

  /**
   * Get key rotation information
   */
  getKeyRotationInfo(wrappedDEKs: WrappedDEK[]): KeyRotationInfo {
    if (!wrappedDEKs || wrappedDEKs.length === 0) {
      return {
        currentVersion: this.CURRENT_VERSION,
        availableVersions: [],
        rotationNeeded: false,
      };
    }

    const versions = wrappedDEKs.map(dek => dek.metadata.version);
    const uniqueVersions = [...new Set(versions)].sort((a, b) => b - a);
    const maxVersion = Math.max(...versions);

    return {
      currentVersion: this.CURRENT_VERSION,
      availableVersions: uniqueVersions,
      rotationNeeded: maxVersion < this.CURRENT_VERSION,
    };
  }

  /**
   * Rotate a DEK to a new version
   */
  async rotateDEK(
    wrappedDEK: WrappedDEK,
    oldMasterKey: Uint8Array,
    newMasterKey: Uint8Array,
    newVersion?: number,
  ): Promise<WrappedDEK> {
    try {
      // Unwrap with old master key
      const { dek } = await this.unwrapDEK(wrappedDEK, oldMasterKey);

      // Wrap with new master key
      const rotatedDEK = await this.wrapDEK(dek, newMasterKey, {
        version: newVersion || this.CURRENT_VERSION,
      });

      // Clear the temporary DEK from memory
      this.clearMemory(dek);

      return rotatedDEK;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to rotate DEK: ${error.message}`);
    }
  }

  /**
   * Clear sensitive data from memory
   */
  clearMemory(data: Uint8Array | Uint8Array[]): void {
    try {
      const arrays = Array.isArray(data) ? data : [data];
      
      for (const array of arrays) {
        if (array && array.length > 0) {
          // Zero out the memory
          array.fill(0);
          
          // Additional security measure: fill with random data then zero again
          if (this.sodium) {
            const randomData = this.sodium.randombytes_buf(array.length);
            array.set(randomData);
            array.fill(0);
          }
        }
      }
    } catch (error) {
      // Log error but don't throw - memory clearing should be best effort
      console.error('Failed to clear memory:', error.message);
    }
  }

  /**
   * Generate a master key for DEK wrapping
   */
  async generateMasterKey(): Promise<Uint8Array> {
    await this.ensureSodiumReady();
    return this.sodium.randombytes_buf(this.DEK_SIZE);
  }

  /**
   * Derive a master key from a password using Argon2id
   */
  async deriveMasterKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    await this.ensureSodiumReady();

    try {
      // Use Argon2id for key derivation (recommended for password-based keys)
      const key = this.sodium.crypto_pwhash(
        this.DEK_SIZE, // output length
        password,
        salt,
        this.sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE, // operations limit
        this.sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE, // memory limit
        this.sodium.crypto_pwhash_ALG_ARGON2ID13, // algorithm
      );

      return key;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to derive master key: ${error.message}`);
    }
  }

  /**
   * Generate a salt for key derivation
   */
  async generateSalt(): Promise<Uint8Array> {
    await this.ensureSodiumReady();
    return this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES);
  }

  private async ensureSodiumReady(): Promise<void> {
    if (!this.sodium) {
      await this.initializeSodium();
    }
  }

  private validateKeySize(key: Uint8Array, expectedSize: number, keyName: string): void {
    if (!key || key.length !== expectedSize) {
      throw new BadRequestException(
        `${keyName} must be ${expectedSize} bytes, got ${key?.length || 0}`,
      );
    }
  }
}