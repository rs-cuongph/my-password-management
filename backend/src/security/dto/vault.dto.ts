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
import { EncryptedVaultPayloadDto } from './vault-payload.dto';

/**
 * Response DTO for GET /vault endpoint
 */
export class GetVaultResponseDto {
  @IsObject()
  kdfJson: {
    salt: string;
    iterations: number;
    memorySize: number;
    parallelism: number;
  };

  @IsString()
  wrappedDEK: string; // Changed from wrappedDek to wrappedDEK

  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto; // Changed from blobCiphertext to encryptedPayload

  @IsNumber()
  @Min(1)
  version: number;

  @IsOptional()
  @IsDateString()
  lastUpdated?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    entriesCount: number;
    boardsCount: number;
    lastSyncAt: string;
  };
}

/**
 * Request DTO for POST /vault endpoint
 */
export class SaveVaultRequestDto {
  @IsObject()
  kdfJson: {
    salt: string;
    iterations: number;
    memorySize: number;
    parallelism: number;
  };

  @IsString()
  wrappedDEK: string; // Changed from wrappedDek to wrappedDEK

  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expectedVersion?: number;

  @IsOptional()
  force?: boolean;
}

/**
 * Response DTO for POST /vault endpoint
 */
export class SaveVaultResponseDto {
  success: boolean;

  @IsNumber()
  @Min(1)
  version: number;

  @IsOptional()
  @IsDateString()
  savedAt?: string;

  @IsOptional()
  @IsString()
  versionConflictWarning?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    entriesCount: number;
    boardsCount: number;
    lastSyncAt: string;
  };
}

/**
 * DTO for version conflict error response
 */
export class VaultVersionConflictDto {
  error: 'VERSION_CONFLICT';

  message: string;

  @IsNumber()
  currentVersion: number;

  @IsNumber()
  expectedVersion: number;

  @IsDateString()
  lastUpdated: string;
}

/**
 * Request DTO for GET /vault/version endpoint
 */
export class CheckVaultVersionRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  clientVersion?: number;
}

/**
 * Response DTO for GET /vault/version endpoint
 */
export class CheckVaultVersionResponseDto {
  @IsNumber()
  @Min(0)
  currentVersion: number;

  isUpToDate: boolean;

  @IsOptional()
  @IsDateString()
  lastUpdated?: string;

  @IsOptional()
  @IsNumber()
  versionDifference?: number;
}
