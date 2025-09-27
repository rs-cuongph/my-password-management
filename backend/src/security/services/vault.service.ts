import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  GetVaultResponseDto,
  SaveVaultRequestDto,
  SaveVaultResponseDto,
} from '../dto/vault.dto';
import { EncryptedVaultPayloadDto } from '../dto/vault-payload.dto';

interface VaultData {
  id: number;
  kdfJson: string;
  wrappedDek: string;
  blobCiphertext: string;
  version: number;
  lastUpdated: Date;
  createdAt: Date;
}

interface UpsertVaultData {
  kdfJson: string;
  wrappedDek: string;
  blobCiphertext: string;
}

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
        kdfJson: JSON.parse(vault.kdfJson) as {
          salt: string;
          iterations: number;
          memorySize: number;
          parallelism: number;
        },
        wrappedDEK: vault.wrappedDek,
        encryptedPayload: JSON.parse(
          vault.blobCiphertext,
        ) as EncryptedVaultPayloadDto,
        version: vault.version,
        lastUpdated: vault.lastUpdated?.toISOString(),
        metadata: {
          entriesCount: 0,
          boardsCount: 0,
          lastSyncAt:
            vault.lastUpdated?.toISOString() || new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to retrieve vault: ${message}`,
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

      // Calculate metadata (for future use)
      // const sizeInBytes = this.calculateVaultSize(vaultData.blobCiphertext);
      // const compressionUsed = vaultData.blobCiphertext.compressed;

      // Save vault data
      await this.upsertVault(userId, {
        kdfJson: JSON.stringify(vaultData.kdfJson),
        wrappedDek: vaultData.wrappedDEK, // Map from wrappedDEK to wrappedDek for database
        blobCiphertext: JSON.stringify(vaultData.encryptedPayload), // Map from encryptedPayload to blobCiphertext for database
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
          entriesCount: 0,
          boardsCount: 0,
          lastSyncAt: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to save vault: ${message}`,
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
      return vault?.version ?? -1; // -1 indicates no vault exists
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to get vault version: ${message}`,
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
      return vault?.lastUpdated ?? null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to get last updated: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate vault size constraints
   */
  validateVaultSize(vaultData: SaveVaultRequestDto): void {
    const encryptedDataSize = Buffer.from(
      vaultData.encryptedPayload.encryptedData,
      'base64',
    ).length;
    const totalSize = this.calculateVaultSize(vaultData.encryptedPayload);

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
    this.validateCiphertextFormat(vaultData.encryptedPayload);
  }

  /**
   * Validate ciphertext format and structure
   */
  private validateCiphertextFormat(
    encryptedPayload: EncryptedVaultPayloadDto,
  ): void {
    // Validate required fields
    if (
      !encryptedPayload.encryptedData ||
      !encryptedPayload.nonce ||
      !encryptedPayload.tag
    ) {
      throw new HttpException(
        'Invalid ciphertext: missing required fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate base64 encoding
    try {
      Buffer.from(encryptedPayload.encryptedData, 'base64');
      Buffer.from(encryptedPayload.nonce, 'base64');
      Buffer.from(encryptedPayload.tag, 'base64');
    } catch {
      throw new HttpException(
        'Invalid ciphertext: invalid base64 encoding',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate nonce size (24 bytes for XChaCha20)
    const nonceBuffer = Buffer.from(encryptedPayload.nonce, 'base64');
    if (nonceBuffer.length !== 24) {
      throw new HttpException(
        `Invalid nonce size: expected 24 bytes, got ${nonceBuffer.length}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate tag size (16 bytes for Poly1305)
    const tagBuffer = Buffer.from(encryptedPayload.tag, 'base64');
    if (tagBuffer.length !== 16) {
      throw new HttpException(
        `Invalid tag size: expected 16 bytes, got ${tagBuffer.length}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate algorithm
    if (encryptedPayload.algorithm !== 'xchacha20-poly1305') {
      throw new HttpException(
        `Unsupported algorithm: ${String(encryptedPayload.algorithm)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate version
    if (!encryptedPayload.version || encryptedPayload.version < 1) {
      throw new HttpException(
        'Invalid encryption version',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Calculate total vault size in bytes
   */
  private calculateVaultSize(
    encryptedPayload: EncryptedVaultPayloadDto,
  ): number {
    const encryptedData = Buffer.from(
      encryptedPayload.encryptedData,
      'base64',
    ).length;
    const nonce = Buffer.from(encryptedPayload.nonce, 'base64').length;
    const tag = Buffer.from(encryptedPayload.tag, 'base64').length;

    // Add some overhead for metadata
    const metadataOverhead = JSON.stringify({
      algorithm: encryptedPayload.algorithm,
      version: encryptedPayload.version,
      compressed: encryptedPayload.compressed,
      createdAt: encryptedPayload.createdAt,
    }).length;

    return encryptedData + nonce + tag + metadataOverhead;
  }

  /**
   * Find vault by user ID - placeholder implementation
   * This needs to be updated based on the actual Prisma schema
   */
  private async findVaultByUserId(userId: string): Promise<VaultData | null> {
    try {
      return await this.prisma.userVault.findFirst({
        where: { userId: parseInt(userId) },
        select: {
          id: true,
          kdfJson: true,
          wrappedDek: true,
          blobCiphertext: true,
          version: true,
          lastUpdated: true,
          createdAt: true,
        },
      });
    } catch (error: unknown) {
      console.error('Error finding vault by user ID:', error);
      throw new HttpException(
        'Failed to retrieve vault data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Upsert vault data - placeholder implementation
   * This needs to be updated based on the actual Prisma schema
   */
  private async upsertVault(
    userId: string,
    vaultData: UpsertVaultData & { version: number },
  ): Promise<VaultData> {
    try {
      const userIdInt = parseInt(userId);

      // First try to find existing vault
      const existingVault = await this.prisma.userVault.findFirst({
        where: { userId: userIdInt },
      });

      if (existingVault) {
        // Update existing vault
        return await this.prisma.userVault.update({
          where: { id: existingVault.id },
          data: {
            kdfJson: vaultData.kdfJson,
            wrappedDek: vaultData.wrappedDek,
            blobCiphertext: vaultData.blobCiphertext,
            version: vaultData.version,
            lastUpdated: new Date(),
          },
        });
      } else {
        // Create new vault
        return await this.prisma.userVault.create({
          data: {
            userId: userIdInt,
            kdfJson: vaultData.kdfJson,
            wrappedDek: vaultData.wrappedDek,
            blobCiphertext: vaultData.blobCiphertext,
            version: vaultData.version,
            lastUpdated: new Date(),
          },
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error upserting vault:', message);
      throw new HttpException(
        'Failed to save vault data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
