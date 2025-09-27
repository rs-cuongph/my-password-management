import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { Throttle } from '@nestjs/throttler';
import { VaultPayloadService } from '../services/vault-payload.service';
import { WrappedDEK } from '../interfaces/dek.interface';
import {
  EncryptVaultPayloadRequestDto,
  EncryptVaultPayloadResponseDto,
  DecryptVaultPayloadRequestDto,
  DecryptVaultPayloadResponseDto,
  EncryptVaultWithPasswordRequestDto,
  EncryptVaultWithPasswordResponseDto,
  DecryptVaultWithPasswordRequestDto,
  ReencryptVaultPayloadRequestDto,
  GetVaultStatsRequestDto,
  GetVaultStatsResponseDto,
} from '../dto/vault-payload.dto';

/**
 * VaultPayloadController - Advanced encryption operations
 *
 * This controller provides advanced encryption/decryption operations for vault payloads.
 * It's designed for internal use and advanced crypto operations like:
 * - Password-based encryption/decryption
 * - Key rotation (re-encryption)
 * - Encryption statistics
 *
 * For basic vault operations, use VaultController instead.
 */
@Controller('security/vault-payload')
@UseGuards(JwtAuthGuard) // Added authentication
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VaultPayloadController {
  constructor(private readonly vaultPayloadService: VaultPayloadService) {}

  @Post('encrypt')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async encryptPayload(
    @Body() request: EncryptVaultPayloadRequestDto,
  ): Promise<EncryptVaultPayloadResponseDto> {
    try {
      // Convert base64 DEK to Uint8Array
      const dek = new Uint8Array(Buffer.from(request.dek, 'base64'));

      // Convert DTO to service interface
      const payload = {
        entries: request.payload.entries.map((entry) => ({
          ...entry,
          dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        })),
        boards: request.payload.boards.map((board) => ({
          ...board,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt),
        })),
        metadata: {
          ...request.payload.metadata,
          lastSyncAt: new Date(request.payload.metadata.lastSyncAt),
        },
      };

      const startTime = Date.now();
      const encryptedPayload = await this.vaultPayloadService.encryptPayload(
        payload,
        dek,
        request.options || {},
      );
      const encryptionTime = Date.now() - startTime;

      // Get encryption statistics
      const stats =
        this.vaultPayloadService.getEncryptionStats(encryptedPayload);

      return {
        encryptedPayload,
        stats: {
          ...stats,
          encryptionTime,
          originalSize: Buffer.from(JSON.stringify(payload)).length,
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('decrypt')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  async decryptPayload(
    @Body() request: DecryptVaultPayloadRequestDto,
  ): Promise<DecryptVaultPayloadResponseDto> {
    try {
      // Convert base64 DEK to Uint8Array
      const dek = new Uint8Array(Buffer.from(request.dek, 'base64'));

      // Convert DTO to service interface
      const encryptedPayload = {
        ...request.encryptedPayload,
        createdAt: new Date(request.encryptedPayload.createdAt),
      };

      const result = await this.vaultPayloadService.decryptPayload(
        encryptedPayload,
        dek,
        request.options || {},
      );

      return {
        payload: result.payload as any, // Type assertion for DTO compatibility
        stats: {
          decryptionTime: result.decryptionTime,
          compressionRatio: result.compressionRatio,
          warnings: result.warnings,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('encrypt-with-password')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes (more restrictive for password operations)
  async encryptVaultWithPassword(
    @Body() request: EncryptVaultWithPasswordRequestDto,
  ): Promise<EncryptVaultWithPasswordResponseDto> {
    try {
      // Convert base64 salt to Uint8Array
      const salt = new Uint8Array(Buffer.from(request.salt, 'base64'));

      // Convert DTO to service interface
      const payload = {
        entries: request.payload.entries.map((entry) => ({
          ...entry,
          dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        })),
        passwordEntries: request.payload.passwordEntries?.map((entry) => ({
          ...entry,
          lastUsed: entry.lastUsed ? new Date(entry.lastUsed) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        })),
        boards: request.payload.boards.map((board) => ({
          ...board,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt),
        })),
        metadata: {
          ...request.payload.metadata,
          lastSyncAt: new Date(request.payload.metadata.lastSyncAt),
        },
      };

      const startTime = Date.now();
      const result = await this.vaultPayloadService.encryptVaultWithPassword(
        payload,
        request.password,
        salt,
        request.options || {},
      );
      const encryptionTime = Date.now() - startTime;

      // Get encryption statistics
      const stats = this.vaultPayloadService.getEncryptionStats(
        result.encryptedPayload,
      );

      return {
        encryptedPayload: result.encryptedPayload,
        wrappedDEK: JSON.stringify(result.wrappedDEK),
        stats: {
          ...stats,
          encryptionTime,
          originalSize: Buffer.from(JSON.stringify(payload)).length,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Password encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('decrypt-with-password')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 requests per 5 minutes
  async decryptVaultWithPassword(
    @Body() request: DecryptVaultWithPasswordRequestDto,
  ): Promise<DecryptVaultPayloadResponseDto> {
    try {
      // Convert base64 salt to Uint8Array
      const salt = new Uint8Array(Buffer.from(request.salt, 'base64'));

      // Convert DTO to service interface
      const encryptedPayload = {
        ...request.encryptedPayload,
        createdAt: new Date(request.encryptedPayload.createdAt),
      };

      const wrappedDEK = JSON.parse(request.wrappedDEK) as WrappedDEK; // Parse and cast WrappedDEK
      const result = await this.vaultPayloadService.decryptVaultWithPassword(
        encryptedPayload,
        wrappedDEK, // WrappedDEK from JSON parse
        request.password,
        salt,
        request.options || {},
      );

      return {
        payload: result.payload as any, // Type assertion to match DTO
        stats: {
          decryptionTime: result.decryptionTime,
          compressionRatio: result.compressionRatio,
          warnings: result.warnings,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Password decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('reencrypt')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes (key rotation is sensitive)
  async reencryptPayload(
    @Body() request: ReencryptVaultPayloadRequestDto,
  ): Promise<EncryptVaultPayloadResponseDto> {
    try {
      // Convert base64 DEKs to Uint8Array
      const oldDEK = new Uint8Array(Buffer.from(request.oldDEK, 'base64'));
      const newDEK = new Uint8Array(Buffer.from(request.newDEK, 'base64'));

      // Convert DTO to service interface
      const encryptedPayload = {
        ...request.encryptedPayload,
        createdAt: new Date(request.encryptedPayload.createdAt),
      };

      const startTime = Date.now();
      const newEncryptedPayload =
        await this.vaultPayloadService.reencryptPayload(
          encryptedPayload,
          oldDEK,
          newDEK,
          request.options || {},
        );
      const encryptionTime = Date.now() - startTime;

      // Get encryption statistics
      const stats =
        this.vaultPayloadService.getEncryptionStats(newEncryptedPayload);

      return {
        encryptedPayload: newEncryptedPayload,
        stats: {
          ...stats,
          encryptionTime,
          originalSize: stats.encryptedSize, // Approximate since we don't have original
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Re-encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('stats')
  @HttpCode(HttpStatus.OK)
  // @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute (read-only operation)
  getVaultStats(
    @Body() request: GetVaultStatsRequestDto,
  ): GetVaultStatsResponseDto {
    try {
      // Convert DTO to service interface
      const encryptedPayload = {
        ...request.encryptedPayload,
        createdAt: new Date(request.encryptedPayload.createdAt),
      };

      const baseStats =
        this.vaultPayloadService.getEncryptionStats(encryptedPayload);

      // Convert to response DTO format
      const stats = {
        originalSize: baseStats.encryptedSize, // Approximate since we don't have original
        encryptedSize: baseStats.encryptedSize,
        compressionRatio: undefined,
        encryptionTime: 0, // Not available for pre-encrypted data
        compressed: baseStats.compressed,
      };

      return { stats };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get vault statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
