import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import {
  GetVaultResponseDto,
  SaveVaultRequestDto,
  SaveVaultResponseDto,
  VaultVersionConflictDto,
  CheckVaultVersionRequestDto,
  CheckVaultVersionResponseDto,
} from '../dto/vault.dto';
import { VaultService } from '../services/vault.service';

@ApiTags('Vault')
@Controller('vault')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  @ApiOperation({
    summary: 'Get encrypted vault data',
    description:
      'Retrieve encrypted vault data including KDF parameters, wrapped DEK, and encrypted blob',
  })
  @ApiResponse({
    status: 200,
    description: 'Vault data retrieved successfully',
    type: GetVaultResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Vault not found for user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid JWT token',
  })
  @RateLimit(30, 60000) // 30 requests per minute
  async getVault(@Req() req: Request): Promise<GetVaultResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new HttpException(
        'User not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const vault = await this.vaultService.getVaultByUserId(userId);
      if (!vault) {
        throw new HttpException('Vault not found', HttpStatus.NOT_FOUND);
      }

      return vault;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve vault',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Save encrypted vault data',
    description: 'Save encrypted vault data with version conflict detection',
  })
  @ApiBody({
    type: SaveVaultRequestDto,
    description: 'Vault data to save with KDF parameters and encrypted content',
  })
  @ApiResponse({
    status: 200,
    description: 'Vault saved successfully',
    type: SaveVaultResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Version conflict detected',
    type: VaultVersionConflictDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid vault data or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid JWT token',
  })
  @ApiResponse({
    status: 413,
    description: 'Vault data too large',
  })
  @RateLimit(10, 60000) // 10 requests per minute
  async saveVault(
    @Req() req: Request,
    @Body() saveVaultDto: SaveVaultRequestDto,
  ): Promise<SaveVaultResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new HttpException(
        'User not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Validate vault size limits
      await this.vaultService.validateVaultSize(saveVaultDto);

      // Check for version conflicts if expectedVersion is provided
      if (saveVaultDto.expectedVersion !== undefined) {
        const currentVersion =
          await this.vaultService.getCurrentVersion(userId);
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

      const result = await this.vaultService.saveVault(userId, saveVaultDto);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle specific error types
      if (error.message?.includes('too large')) {
        throw new HttpException(
          'Vault data exceeds size limit',
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      if (error.message?.includes('validation')) {
        throw new HttpException(
          'Invalid vault data format',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to save vault',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('version')
  @ApiOperation({
    summary: 'Check vault version',
    description: 'Check current vault version for conflict detection',
  })
  @ApiQuery({
    name: 'clientVersion',
    type: Number,
    required: false,
    description: 'Client version to check against',
  })
  @ApiResponse({
    status: 200,
    description: 'Version check completed',
    type: CheckVaultVersionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Vault not found for user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid JWT token',
  })
  @RateLimit(60, 30000) // 60 requests per 30 seconds
  async checkVaultVersion(
    @Req() req: Request,
    @Query() query: CheckVaultVersionRequestDto,
  ): Promise<CheckVaultVersionResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new HttpException(
        'User not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const currentVersion = await this.vaultService.getCurrentVersion(userId);
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

      const lastUpdated = await this.vaultService.getLastUpdated(userId);

      return {
        currentVersion,
        isUpToDate,
        lastUpdated: lastUpdated?.toISOString(),
        versionDifference,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check vault version',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
