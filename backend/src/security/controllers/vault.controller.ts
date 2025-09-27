import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../../auth/decorators/current-user.decorator';
// import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import {
  GetVaultResponseDto,
  SaveVaultRequestDto,
  SaveVaultResponseDto,
  VaultVersionConflictDto,
  CheckVaultVersionRequestDto,
  CheckVaultVersionResponseDto,
} from '../dto/vault.dto';
import { VaultService } from '../services/vault.service';

/**
 * VaultController - Main vault management operations
 *
 * This controller handles the primary vault operations for users:
 * - GET /vault - Load user's vault from database
 * - POST /vault - Save user's vault to database
 * - GET /vault/version - Check version conflicts
 *
 * For encryption/decryption operations, use VaultPayloadController.
 */
@Controller('vault')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  // @RateLimit(30, 60000) // 30 requests per minute
  async getVault(
    @CurrentUser() user: CurrentUserType,
  ): Promise<GetVaultResponseDto> {
    try {
      const vault = await this.vaultService.getVaultByUserId(
        user.userId.toString(),
      );
      if (!vault) {
        throw new HttpException('Vault not found', HttpStatus.NO_CONTENT);
      }

      return vault;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to retrieve vault: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  // @RateLimit(10, 60000) // 10 requests per minute
  async saveVault(
    @CurrentUser() user: CurrentUserType,
    @Body() saveVaultDto: SaveVaultRequestDto,
  ): Promise<SaveVaultResponseDto> {
    try {
      // Validate vault size limits
      this.vaultService.validateVaultSize(saveVaultDto);

      // Check for version conflicts if expectedVersion is provided
      if (saveVaultDto.expectedVersion !== undefined) {
        const currentVersion = await this.vaultService.getCurrentVersion(
          user.userId.toString(),
        );
        if (
          currentVersion !== saveVaultDto.expectedVersion &&
          !saveVaultDto.force
        ) {
          const conflictError: VaultVersionConflictDto = {
            error: 'VERSION_CONFLICT',
            message: `Version conflict: expected ${saveVaultDto.expectedVersion}, current is ${currentVersion}`,
            currentVersion,
            expectedVersion: saveVaultDto.expectedVersion,
            lastUpdated: new Date().toISOString(),
          };
          throw new HttpException(conflictError, HttpStatus.CONFLICT);
        }
      }

      const result = await this.vaultService.saveVault(
        user.userId.toString(),
        saveVaultDto,
      );
      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific error types
      if (message.includes('too large')) {
        throw new HttpException(
          'Vault data exceeds size limit',
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      if (message.includes('validation')) {
        throw new HttpException(
          'Invalid vault data format',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Failed to save vault: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('version')
  // @RateLimit(60, 30000) // 60 requests per 30 seconds
  async checkVaultVersion(
    @CurrentUser() user: CurrentUserType,
    @Query() query: CheckVaultVersionRequestDto,
  ): Promise<CheckVaultVersionResponseDto> {
    try {
      const currentVersion = await this.vaultService.getCurrentVersion(
        user.userId.toString(),
      );
      if (currentVersion === -1) {
        throw new HttpException('Vault not found', HttpStatus.NOT_FOUND);
      }

      const isUpToDate =
        query.clientVersion === undefined ||
        query.clientVersion === currentVersion;

      const versionDifference =
        query.clientVersion !== undefined
          ? currentVersion - query.clientVersion
          : undefined;

      const lastUpdated = await this.vaultService.getLastUpdated(
        user.userId.toString(),
      );

      return {
        currentVersion,
        isUpToDate,
        lastUpdated: lastUpdated?.toISOString(),
        versionDifference,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to check vault version: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
