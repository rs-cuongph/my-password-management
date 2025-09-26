import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  GetVaultResponseDto,
  SaveVaultRequestDto,
  SaveVaultResponseDto,
} from '../dto/vault.dto';
import { EncryptedVaultPayloadDto } from '../dto/vault-payload.dto';

@Injectable()
export class VaultService {
  // Maximum vault size: 50MB
  private readonly MAX_VAULT_SIZE = 50 * 1024 * 1024;
  // Maximum encrypted data size: 52MB (accounting for base64 encoding)
  private readonly MAX_ENCRYPTED_SIZE = 52 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get vault data for a user
   */
  async getVaultByUserId(userId: string): Promise<GetVaultResponseDto | null> {
    try {
      // For now, we'll use a placeholder implementation since we need to see the Prisma schema
      // This would typically query the database for vault data
      const vault = await this.findVaultByUserId(userId);

      if (!vault) {
        return null;
      }

      return {
        kdfJson: vault.kdfJson,
        wrappedDek: vault.wrappedDek,
        blobCiphertext: vault.blobCiphertext,
        version: vault.version,
        lastUpdated: vault.lastUpdated?.toISOString(),
        metadata: {
          entryCount: vault.blobCiphertext?.metadata?.entryCount || 0,
          boardCount: vault.blobCiphertext?.metadata?.boardCount || 0,
          checksum: vault.blobCiphertext?.metadata?.checksum,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve vault: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Save vault data for a user
   */
  async saveVault(
    userId: string,
    vaultData: SaveVaultRequestDto,
  ): Promise<SaveVaultResponseDto> {
    try {
      // Get current vault for version comparison
      const currentVault = await this.findVaultByUserId(userId);
      const previousVersion = currentVault?.version || 0;

      // Increment version
      const newVersion = previousVersion + 1;

      // Calculate metadata
      const sizeInBytes = this.calculateVaultSize(vaultData.blobCiphertext);
      const compressionUsed = vaultData.blobCiphertext.compressed;

      // Save vault data
      const savedVault = await this.upsertVault(userId, {
        ...vaultData,
        version: newVersion,
      });

      const versionConflictWarning =
        vaultData.expectedVersion !== undefined &&
        vaultData.expectedVersion !== previousVersion &&
        vaultData.force
          ? `Forced save: expected version ${vaultData.expectedVersion}, was ${previousVersion}`
          : undefined;

      return {
        success: true,
        version: newVersion,
        savedAt: new Date().toISOString(),
        versionConflictWarning,
        metadata: {
          previousVersion,
          sizeInBytes,
          compressionUsed,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to save vault: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current version of vault for a user
   */
  async getCurrentVersion(userId: string): Promise<number> {
    try {
      const vault = await this.findVaultByUserId(userId);
      return vault?.version || -1; // -1 indicates no vault exists
    } catch (error) {
      throw new HttpException(
        `Failed to get vault version: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get last updated timestamp for vault
   */
  async getLastUpdated(userId: string): Promise<Date | null> {
    try {
      const vault = await this.findVaultByUserId(userId);
      return vault?.lastUpdated || null;
    } catch (error) {
      throw new HttpException(
        `Failed to get last updated: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate vault size constraints
   */
  async validateVaultSize(vaultData: SaveVaultRequestDto): Promise<void> {
    const encryptedDataSize = Buffer.from(
      vaultData.blobCiphertext.encryptedData,
      'base64',
    ).length;
    const totalSize = this.calculateVaultSize(vaultData.blobCiphertext);

    if (totalSize > this.MAX_VAULT_SIZE) {
      throw new HttpException(
        `Vault size ${totalSize} bytes exceeds limit of ${this.MAX_VAULT_SIZE} bytes`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    if (encryptedDataSize > this.MAX_ENCRYPTED_SIZE) {
      throw new HttpException(
        `Encrypted data size ${encryptedDataSize} bytes exceeds limit of ${this.MAX_ENCRYPTED_SIZE} bytes`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    // Validate ciphertext format
    this.validateCiphertextFormat(vaultData.blobCiphertext);
  }

  /**
   * Validate ciphertext format and structure
   */
  private validateCiphertextFormat(ciphertext: EncryptedVaultPayloadDto): void {
    // Validate required fields
    if (!ciphertext.encryptedData || !ciphertext.nonce || !ciphertext.tag) {
      throw new HttpException(
        'Invalid ciphertext: missing required fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate base64 encoding
    try {
      Buffer.from(ciphertext.encryptedData, 'base64');
      Buffer.from(ciphertext.nonce, 'base64');
      Buffer.from(ciphertext.tag, 'base64');
    } catch (error) {
      throw new HttpException(
        'Invalid ciphertext: invalid base64 encoding',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate nonce size (24 bytes for XChaCha20)
    const nonceBuffer = Buffer.from(ciphertext.nonce, 'base64');
    if (nonceBuffer.length !== 24) {
      throw new HttpException(
        `Invalid nonce size: expected 24 bytes, got ${nonceBuffer.length}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate tag size (16 bytes for Poly1305)
    const tagBuffer = Buffer.from(ciphertext.tag, 'base64');
    if (tagBuffer.length !== 16) {
      throw new HttpException(
        `Invalid tag size: expected 16 bytes, got ${tagBuffer.length}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate algorithm
    if (ciphertext.algorithm !== 'xchacha20-poly1305') {
      throw new HttpException(
        `Unsupported algorithm: ${ciphertext.algorithm}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate version
    if (!ciphertext.version || ciphertext.version < 1) {
      throw new HttpException(
        'Invalid encryption version',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Calculate total vault size in bytes
   */
  private calculateVaultSize(ciphertext: EncryptedVaultPayloadDto): number {
    const encryptedData = Buffer.from(
      ciphertext.encryptedData,
      'base64',
    ).length;
    const nonce = Buffer.from(ciphertext.nonce, 'base64').length;
    const tag = Buffer.from(ciphertext.tag, 'base64').length;

    // Add some overhead for metadata
    const metadataOverhead = JSON.stringify({
      algorithm: ciphertext.algorithm,
      version: ciphertext.version,
      compressed: ciphertext.compressed,
      createdAt: ciphertext.createdAt,
    }).length;

    return encryptedData + nonce + tag + metadataOverhead;
  }

  /**
   * Find vault by user ID - placeholder implementation
   * This needs to be updated based on the actual Prisma schema
   */
  private async findVaultByUserId(_userId: string): Promise<any> {
    // TODO: Implement actual database query based on Prisma schema
    // For now, returning null to indicate no implementation
    // This would typically be something like:
    // return await this.prisma.vault.findUnique({
    //   where: { userId },
    // });
    return null;
  }

  /**
   * Upsert vault data - placeholder implementation
   * This needs to be updated based on the actual Prisma schema
   */
  private async upsertVault(_userId: string, vaultData: any): Promise<any> {
    // TODO: Implement actual database upsert based on Prisma schema
    // This would typically be something like:
    // return await this.prisma.vault.upsert({
    //   where: { userId },
    //   create: {
    //     userId,
    //     kdfJson: vaultData.kdfJson,
    //     wrappedDek: vaultData.wrappedDek,
    //     blobCiphertext: vaultData.blobCiphertext,
    //     version: vaultData.version,
    //     lastUpdated: new Date(),
    //   },
    //   update: {
    //     kdfJson: vaultData.kdfJson,
    //     wrappedDek: vaultData.wrappedDek,
    //     blobCiphertext: vaultData.blobCiphertext,
    //     version: vaultData.version,
    //     lastUpdated: new Date(),
    //   },
    // });

    // Placeholder return
    return {
      version: vaultData.version,
      lastUpdated: new Date(),
    };
  }
}
