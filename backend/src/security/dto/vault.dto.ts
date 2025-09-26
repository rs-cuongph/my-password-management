import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EncryptedVaultPayloadDto } from './vault-payload.dto';

/**
 * Response DTO for GET /vault endpoint
 */
export class GetVaultResponseDto {
  @ApiProperty({ description: 'KDF parameters used for key derivation' })
  @IsObject()
  kdfJson: {
    salt: string;
    iterations: number;
    memorySize: number;
    parallelism: number;
  };

  @ApiProperty({ description: 'Base64-encoded wrapped DEK' })
  @IsString()
  wrappedDek: string;

  @ApiProperty({
    description: 'Encrypted vault data',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  blobCiphertext: EncryptedVaultPayloadDto;

  @ApiProperty({ description: 'Vault data version for conflict detection' })
  @IsNumber()
  @Min(1)
  version: number;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  @IsOptional()
  @IsDateString()
  lastUpdated?: string;

  @ApiPropertyOptional({ description: 'Additional vault metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    entryCount: number;
    boardCount: number;
    checksum?: string;
  };
}

/**
 * Request DTO for POST /vault endpoint
 */
export class SaveVaultRequestDto {
  @ApiProperty({ description: 'KDF parameters for key derivation' })
  @IsObject()
  kdfJson: {
    salt: string;
    iterations: number;
    memorySize: number;
    parallelism: number;
  };

  @ApiProperty({ description: 'Base64-encoded wrapped DEK' })
  @IsString()
  wrappedDek: string;

  @ApiProperty({
    description: 'Encrypted vault data',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  blobCiphertext: EncryptedVaultPayloadDto;

  @ApiPropertyOptional({
    description: 'Expected current version for conflict detection',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedVersion?: number;

  @ApiPropertyOptional({ description: 'Force save even if version conflict' })
  @IsOptional()
  force?: boolean;
}

/**
 * Response DTO for POST /vault endpoint
 */
export class SaveVaultResponseDto {
  @ApiProperty({ description: 'Whether save was successful' })
  success: boolean;

  @ApiProperty({ description: 'New vault version after save' })
  @IsNumber()
  @Min(1)
  version: number;

  @ApiPropertyOptional({ description: 'Save timestamp' })
  @IsOptional()
  @IsDateString()
  savedAt?: string;

  @ApiPropertyOptional({ description: 'Warning if version conflict occurred' })
  @IsOptional()
  @IsString()
  versionConflictWarning?: string;

  @ApiPropertyOptional({ description: 'Additional save metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    previousVersion: number;
    sizeInBytes: number;
    compressionUsed: boolean;
  };
}

/**
 * Error response for version conflicts
 */
export class VaultVersionConflictDto {
  @ApiProperty({ description: 'Error code for version conflict' })
  error: 'VERSION_CONFLICT';

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Current version on server' })
  @IsNumber()
  currentVersion: number;

  @ApiProperty({ description: 'Expected version from client' })
  @IsNumber()
  expectedVersion: number;

  @ApiProperty({ description: 'Timestamp of last server update' })
  @IsDateString()
  lastUpdated: string;
}

/**
 * Request DTO for vault version check
 */
export class CheckVaultVersionRequestDto {
  @ApiPropertyOptional({ description: 'Client version to check against' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clientVersion?: number;
}

/**
 * Response DTO for vault version check
 */
export class CheckVaultVersionResponseDto {
  @ApiProperty({ description: 'Current vault version on server' })
  @IsNumber()
  @Min(0)
  currentVersion: number;

  @ApiProperty({ description: 'Whether client is up to date' })
  isUpToDate: boolean;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  @IsOptional()
  @IsDateString()
  lastUpdated?: string;

  @ApiPropertyOptional({ description: 'Version difference if out of date' })
  @IsOptional()
  @IsNumber()
  versionDifference?: number;
}
