import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _sodium from 'libsodium-wrappers';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { DEKService } from './dek.service';
import { WrappedDEK, DEKResult } from '../interfaces/dek.interface';
import {
  VaultPayload,
  EncryptedVaultPayload,
  VaultDecryptionResult,
  VaultEncryptionOptions,
  VaultDecryptionOptions,
  VaultEncryptionStats,
} from '../interfaces/vault-payload.interface';

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class VaultPayloadService {
  private sodium: typeof _sodium;
  private readonly NONCE_SIZE = 24; // XChaCha20 nonce size
  private readonly TAG_SIZE = 16; // Poly1305 tag size
  private readonly CURRENT_VERSION = 1;
  private readonly DEFAULT_COMPRESSION_LEVEL = 6;
  private readonly MAX_PAYLOAD_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(
    private dekService: DEKService,
    private configService: ConfigService,
  ) {}

  private async initializeSodium(): Promise<void> {
    try {
      // Wait for libsodium to be fully ready
      await _sodium.ready;

      // Verify required functions are available
      const requiredFunctions = [
        'randombytes_buf',
        'crypto_aead_xchacha20poly1305_ietf_encrypt',
        'crypto_aead_xchacha20poly1305_ietf_decrypt',
      ];

      for (const func of requiredFunctions) {
        if (!_sodium[func] || typeof _sodium[func] !== 'function') {
          throw new Error(`libsodium function ${func} not available`);
        }
      }

      this.sodium = _sodium;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to initialize libsodium: ${message}`,
      );
    }
  }

  /**
   * Encrypt vault payload with DEK using XChaCha20-Poly1305
   */
  async encryptPayload(
    payload: VaultPayload,
    dek: Uint8Array,
    options: VaultEncryptionOptions = {},
  ): Promise<EncryptedVaultPayload> {
    await this.ensureSodiumReady();

    try {
      // Validate inputs
      this.validateDEK(dek);
      this.validatePayload(payload);

      // Serialize payload to JSON
      const jsonData = JSON.stringify(payload);
      const jsonBuffer = Buffer.from(jsonData, 'utf8');

      let dataToEncrypt: Buffer = jsonBuffer;
      let compressed = false;

      // Apply compression if enabled (default: true)
      if (options.compress !== false) {
        const compressionLevel =
          options.compressionLevel || this.DEFAULT_COMPRESSION_LEVEL;

        try {
          const compressedData = await gzip(jsonBuffer, {
            level: compressionLevel,
          });

          // Only use compression if it actually reduces size significantly
          if (compressedData.length < jsonBuffer.length * 0.9) {
            dataToEncrypt = compressedData;
            compressed = true;
          }
        } catch (compressionError) {
          // If compression fails, continue with uncompressed data
          console.warn(
            'Compression failed, using uncompressed data:',
            compressionError.message,
          );
        }
      }

      // Generate random nonce
      const nonce = this.sodium.randombytes_buf(this.NONCE_SIZE);

      // Prepare additional authenticated data
      const aad = options.aad ? Buffer.from(options.aad, 'utf8') : null;

      // Encrypt using XChaCha20-Poly1305
      const encrypted = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        dataToEncrypt,
        aad,
        null, // nsec (not used)
        nonce,
        dek,
      );

      // Extract ciphertext and tag
      const ciphertext = encrypted.slice(0, -this.TAG_SIZE);
      const tag = encrypted.slice(-this.TAG_SIZE);

      return {
        encryptedData: Buffer.from(ciphertext).toString('base64'),
        nonce: Buffer.from(nonce).toString('base64'),
        tag: Buffer.from(tag).toString('base64'),
        compressed,
        algorithm: 'xchacha20-poly1305',
        version: this.CURRENT_VERSION,
        createdAt: new Date(),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to encrypt vault payload: ${error.message}`,
      );
    }
  }

  /**
   * Decrypt vault payload with DEK
   */
  async decryptPayload(
    encryptedPayload: EncryptedVaultPayload,
    dek: Uint8Array,
    options: VaultDecryptionOptions = {},
  ): Promise<VaultDecryptionResult> {
    await this.ensureSodiumReady();

    const startTime = Date.now();

    try {
      // Validate inputs
      this.validateDEK(dek);
      this.validateEncryptedPayload(encryptedPayload);

      // Check algorithm support
      if (encryptedPayload.algorithm !== 'xchacha20-poly1305') {
        throw new BadRequestException(
          `Unsupported encryption algorithm: ${encryptedPayload.algorithm}`,
        );
      }

      // Decode components
      const encryptedData = Buffer.from(
        encryptedPayload.encryptedData,
        'base64',
      );
      const nonce = Buffer.from(encryptedPayload.nonce, 'base64');
      const tag = Buffer.from(encryptedPayload.tag, 'base64');

      // Validate component sizes
      if (nonce.length !== this.NONCE_SIZE) {
        throw new BadRequestException(
          `Invalid nonce size: expected ${this.NONCE_SIZE}, got ${nonce.length}`,
        );
      }
      if (tag.length !== this.TAG_SIZE) {
        throw new BadRequestException(
          `Invalid tag size: expected ${this.TAG_SIZE}, got ${tag.length}`,
        );
      }

      // Prepare additional authenticated data
      const aad = options.aad ? Buffer.from(options.aad, 'utf8') : null;

      // Combine ciphertext and tag for decryption
      const ciphertextWithTag = new Uint8Array(
        encryptedData.length + tag.length,
      );
      ciphertextWithTag.set(encryptedData);
      ciphertextWithTag.set(tag, encryptedData.length);

      // Decrypt using XChaCha20-Poly1305
      const decrypted = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // nsec (not used)
        ciphertextWithTag,
        aad,
        nonce,
        dek,
      );

      if (!decrypted) {
        throw new BadRequestException(
          'Failed to decrypt vault payload: invalid key or corrupted data',
        );
      }

      let jsonData: string;
      let compressionRatio: number | undefined;

      // Decompress if needed
      if (encryptedPayload.compressed) {
        try {
          const decompressed = await gunzip(Buffer.from(decrypted));

          // Check decompressed size limit
          const maxSize = options.maxPayloadSize || this.MAX_PAYLOAD_SIZE;
          if (decompressed.length > maxSize) {
            throw new BadRequestException(
              `Decompressed payload too large: ${decompressed.length} bytes (max: ${maxSize})`,
            );
          }

          jsonData = decompressed.toString('utf8');
          compressionRatio = decrypted.length / decompressed.length;
        } catch (decompressionError) {
          throw new BadRequestException(
            `Failed to decompress vault payload: ${decompressionError.message}`,
          );
        }
      } else {
        jsonData = Buffer.from(decrypted).toString('utf8');
      }

      // Parse JSON payload
      let payload: VaultPayload;
      try {
        payload = JSON.parse(jsonData);
      } catch (parseError) {
        throw new BadRequestException(
          `Failed to parse vault payload JSON: ${parseError.message}`,
        );
      }

      // Validate parsed payload structure
      this.validatePayload(payload);

      const decryptionTime = Date.now() - startTime;

      return {
        payload,
        compressionRatio,
        decryptionTime,
        warnings: [], // Initialize empty warnings array
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to decrypt vault payload: ${error.message}`,
      );
    }
  }

  /**
   * Encrypt vault with password (uses DEK service for key derivation)
   */
  async encryptVaultWithPassword(
    payload: VaultPayload,
    password: string,
    salt: Uint8Array,
    options: VaultEncryptionOptions = {},
  ): Promise<{
    encryptedPayload: EncryptedVaultPayload;
    wrappedDEK: WrappedDEK;
  }> {
    let dek: Uint8Array | undefined;
    let masterKey: Uint8Array | undefined;

    try {
      // Generate DEK
      const dekResult = await this.dekService.generateDEK();
      dek = dekResult.dek;

      // Derive master key from password
      masterKey = await this.dekService.deriveMasterKey(password, salt);

      // Wrap DEK with master key
      const wrappedDEK = await this.dekService.wrapDEK(dek, masterKey, {
        aad: options.aad,
      });

      // Encrypt payload with DEK
      const encryptedPayload = await this.encryptPayload(payload, dek, options);

      return { encryptedPayload, wrappedDEK };
    } finally {
      // Clean up sensitive data
      if (dek) this.dekService.clearMemory(dek);
      if (masterKey) this.dekService.clearMemory(masterKey);
    }
  }

  /**
   * Decrypt vault with password
   */
  async decryptVaultWithPassword(
    encryptedPayload: EncryptedVaultPayload,
    wrappedDEK: WrappedDEK,
    password: string,
    salt: Uint8Array,
    options: VaultDecryptionOptions = {},
  ): Promise<VaultDecryptionResult> {
    let masterKey: Uint8Array | undefined;
    let dekResult: DEKResult | undefined;

    try {
      // Derive master key from password
      masterKey = await this.dekService.deriveMasterKey(password, salt);

      // Unwrap DEK
      dekResult = await this.dekService.unwrapDEK(wrappedDEK, masterKey, {
        aad: options.aad,
      });

      // Decrypt payload with DEK
      const result = await this.decryptPayload(
        encryptedPayload,
        dekResult.dek,
        options,
      );

      return result;
    } finally {
      // Clean up sensitive data
      if (masterKey) this.dekService.clearMemory(masterKey);
      if (dekResult?.dek) this.dekService.clearMemory(dekResult.dek);
    }
  }

  /**
   * Re-encrypt payload with new DEK (for key rotation)
   */
  async reencryptPayload(
    encryptedPayload: EncryptedVaultPayload,
    oldDEK: Uint8Array,
    newDEK: Uint8Array,
    options: VaultEncryptionOptions = {},
  ): Promise<EncryptedVaultPayload> {
    // Decrypt with old DEK
    const decryptionResult = await this.decryptPayload(
      encryptedPayload,
      oldDEK,
    );

    // Encrypt with new DEK
    const newEncryptedPayload = await this.encryptPayload(
      decryptionResult.payload,
      newDEK,
      options,
    );

    return newEncryptedPayload;
  }

  /**
   * Validate DEK
   */
  private validateDEK(dek: Uint8Array): void {
    if (!dek || dek.length !== 32) {
      throw new BadRequestException('DEK must be 32 bytes (256 bits)');
    }
  }

  /**
   * Validate vault payload structure
   */
  private validatePayload(payload: VaultPayload): void {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid payload: must be an object');
    }

    if (!Array.isArray(payload.entries)) {
      throw new BadRequestException(
        'Invalid payload: entries must be an array',
      );
    }

    if (!Array.isArray(payload.boards)) {
      throw new BadRequestException('Invalid payload: boards must be an array');
    }

    if (!payload.metadata || typeof payload.metadata !== 'object') {
      throw new BadRequestException('Invalid payload: metadata is required');
    }

    // Validate metadata structure
    const { metadata } = payload;
    if (
      !metadata.version ||
      !metadata.lastSyncAt ||
      typeof metadata.entriesCount !== 'number' ||
      typeof metadata.boardsCount !== 'number'
    ) {
      throw new BadRequestException('Invalid payload: incomplete metadata');
    }

    // Validate entries
    for (const entry of payload.entries) {
      if (!entry.id || !entry.title || !entry.status || !entry.priority) {
        throw new BadRequestException(
          'Invalid payload: entry missing required fields',
        );
      }

      if (!['todo', 'in-progress', 'done'].includes(entry.status)) {
        throw new BadRequestException(
          `Invalid payload: invalid entry status: ${entry.status}`,
        );
      }

      if (!['low', 'medium', 'high'].includes(entry.priority)) {
        throw new BadRequestException(
          `Invalid payload: invalid entry priority: ${entry.priority}`,
        );
      }
    }

    // Validate boards
    for (const board of payload.boards) {
      if (!board.id || !board.name || !Array.isArray(board.columns)) {
        throw new BadRequestException(
          'Invalid payload: board missing required fields',
        );
      }
    }
  }

  /**
   * Validate encrypted payload structure
   */
  private validateEncryptedPayload(
    encryptedPayload: EncryptedVaultPayload,
  ): void {
    if (!encryptedPayload || typeof encryptedPayload !== 'object') {
      throw new BadRequestException(
        'Invalid encrypted payload: must be an object',
      );
    }

    const requiredFields = [
      'encryptedData',
      'nonce',
      'tag',
      'algorithm',
      'version',
      'createdAt',
    ];
    for (const field of requiredFields) {
      if (!(field in encryptedPayload)) {
        throw new BadRequestException(
          `Invalid encrypted payload: missing field ${field}`,
        );
      }
    }

    if (typeof encryptedPayload.compressed !== 'boolean') {
      throw new BadRequestException(
        'Invalid encrypted payload: compressed must be boolean',
      );
    }
  }

  /**
   * Get encryption statistics for monitoring
   */
  getEncryptionStats(
    encryptedPayload: EncryptedVaultPayload,
  ): VaultEncryptionStats {
    const encryptedSize = Buffer.from(
      encryptedPayload.encryptedData,
      'base64',
    ).length;

    return {
      originalSize: encryptedSize, // We don't have the original size here
      encryptedSize,
      compressionRatio: undefined, // Not available without original size
      encryptionTime: 0, // Not available for pre-encrypted data
      compressed: encryptedPayload.compressed,
    };
  }

  private async ensureSodiumReady(): Promise<void> {
    if (!this.sodium) {
      await this.initializeSodium();
    }
  }
}
