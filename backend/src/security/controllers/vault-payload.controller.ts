import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VaultPayloadService } from '../services/vault-payload.service';
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

@ApiTags('Vault Payload Encryption')
@Controller('api/v1/security/vault-payload')
@UseGuards(/* JwtAuthGuard */) // TODO: Add proper auth guard
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VaultPayloadController {
  constructor(private readonly vaultPayloadService: VaultPayloadService) {}

  @Post('encrypt')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Encrypt vault payload with DEK',
    description:
      'Encrypts a vault payload using XChaCha20-Poly1305 with the provided DEK. Supports optional compression.',
  })
  @ApiBody({ type: EncryptVaultPayloadRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault payload encrypted successfully',
    type: EncryptVaultPayloadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Encryption failed: ${error.message}`);
    }
  }

  @Post('decrypt')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @ApiOperation({
    summary: 'Decrypt vault payload with DEK',
    description:
      'Decrypts a vault payload using XChaCha20-Poly1305 with the provided DEK. Handles decompression if needed.',
  })
  @ApiBody({ type: DecryptVaultPayloadRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault payload decrypted successfully',
    type: DecryptVaultPayloadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters or decryption failed',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
        payload: result.payload,
        compressionRatio: result.compressionRatio,
        decryptionTime: result.decryptionTime,
        warnings: result.warnings,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Decryption failed: ${error.message}`);
    }
  }

  @Post('encrypt-with-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes (more restrictive for password operations)
  @ApiOperation({
    summary: 'Encrypt vault payload with password',
    description:
      'Encrypts a vault payload using a password. Generates a new DEK, wraps it with a key derived from the password, and encrypts the payload.',
  })
  @ApiBody({ type: EncryptVaultWithPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault payload encrypted with password successfully',
    type: EncryptVaultWithPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
        wrappedDEK: result.wrappedDEK,
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
        `Password encryption failed: ${error.message}`,
      );
    }
  }

  @Post('decrypt-with-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 requests per 5 minutes
  @ApiOperation({
    summary: 'Decrypt vault payload with password',
    description:
      'Decrypts a vault payload using a password. Derives the master key from the password, unwraps the DEK, and decrypts the payload.',
  })
  @ApiBody({ type: DecryptVaultWithPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault payload decrypted with password successfully',
    type: DecryptVaultPayloadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters or decryption failed',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

      const result = await this.vaultPayloadService.decryptVaultWithPassword(
        encryptedPayload,
        request.wrappedDEK,
        request.password,
        salt,
        request.options || {},
      );

      return {
        payload: result.payload,
        compressionRatio: result.compressionRatio,
        decryptionTime: result.decryptionTime,
        warnings: result.warnings,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Password decryption failed: ${error.message}`,
      );
    }
  }

  @Post('reencrypt')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes (key rotation is sensitive)
  @ApiOperation({
    summary: 'Re-encrypt vault payload with new DEK',
    description:
      'Re-encrypts a vault payload with a new DEK for key rotation. Decrypts with old DEK and encrypts with new DEK.',
  })
  @ApiBody({ type: ReencryptVaultPayloadRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault payload re-encrypted successfully',
    type: EncryptVaultPayloadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
      throw new BadRequestException(`Re-encryption failed: ${error.message}`);
    }
  }

  @Post('stats')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute (read-only operation)
  @ApiOperation({
    summary: 'Get vault encryption statistics',
    description:
      'Returns statistics about an encrypted vault payload without decrypting it.',
  })
  @ApiBody({ type: GetVaultStatsRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Vault statistics retrieved successfully',
    type: GetVaultStatsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getVaultStats(
    @Body() request: GetVaultStatsRequestDto,
  ): Promise<GetVaultStatsResponseDto> {
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
        `Failed to get vault statistics: ${error.message}`,
      );
    }
  }
}
