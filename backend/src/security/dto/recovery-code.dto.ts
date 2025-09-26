import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  Matches,
  MinLength,
  MaxLength,
  IsBase64,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for generating recovery code for an existing DEK
 */
export class GenerateRecoveryCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  dek: string;
}

/**
 * DTO for recovery key derivation parameters (optional customization)
 */
export class RecoveryKeyDerivationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  opsLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(32 * 1024 * 1024) // Minimum 32MB
  @Max(1024 * 1024 * 1024) // Maximum 1GB
  memLimit?: number;

  @IsOptional()
  @IsNumber()
  algorithm?: number;
}

/**
 * DTO for validating a recovery code
 */
export class ValidateRecoveryCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}$/, {
    message:
      'Recovery code must be in format XXXX-XXXX-XXXX-XXXX with valid base32 characters',
  })
  recoveryCode: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  salt: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecoveryKeyDerivationDto)
  derivationParams?: RecoveryKeyDerivationDto;
}

/**
 * DTO for unwrapping DEK with recovery code
 */
export class RecoverDEKDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}$/, {
    message:
      'Recovery code must be in format XXXX-XXXX-XXXX-XXXX with valid base32 characters',
  })
  recoveryCode: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  salt: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  encryptedDEK: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  nonce: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  tag: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecoveryKeyDerivationDto)
  derivationParams?: RecoveryKeyDerivationDto;
}

/**
 * Response DTO for generated recovery code
 */
export class RecoveryCodeResponseDto {
  @IsString()
  code: string;

  @IsString()
  @IsBase64()
  salt: string;

  @IsDateString()
  createdAt: string;

  @IsNumber()
  version: number;

  @IsArray()
  @IsString({ each: true })
  instructions: string[];
}

/**
 * Response DTO for wrapped DEK with recovery key
 */
export class RecoveryWrappedDEKResponseDto {
  @IsString()
  @IsBase64()
  encryptedDEK: string;

  @IsString()
  @IsBase64()
  nonce: string;

  @IsString()
  @IsBase64()
  tag: string;

  metadata: {
    version: number;
    createdAt: string;
    algorithm: 'xchacha20-poly1305';
    purpose: 'recovery';
  };
}

/**
 * Complete response DTO for recovery code generation
 */
export class GenerateRecoveryCodeResponseDto {
  @ValidateNested()
  @Type(() => RecoveryCodeResponseDto)
  recoveryCode: RecoveryCodeResponseDto;

  @ValidateNested()
  @Type(() => RecoveryWrappedDEKResponseDto)
  wrappedDEK: RecoveryWrappedDEKResponseDto;

  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}

/**
 * Response DTO for recovery code validation
 */
export class ValidateRecoveryCodeResponseDto {
  @IsBoolean()
  valid: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

/**
 * Response DTO for DEK recovery
 */
export class RecoverDEKResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  @IsBase64()
  dek?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  context?: {
    codeFormatValid?: boolean;
    saltValid?: boolean;
    keyDerivationSucceeded?: boolean;
    unwrappingSucceeded?: boolean;
  };
}

/**
 * Response DTO for recovery code statistics
 */
export class RecoveryCodeStatsResponseDto {
  @IsNumber()
  totalGenerated: number;

  @IsNumber()
  successfulRecoveries: number;

  @IsNumber()
  failedRecoveries: number;

  @IsOptional()
  @IsDateString()
  lastGenerated?: string;

  @IsOptional()
  @IsDateString()
  lastRecoveryAttempt?: string;

  @IsNumber()
  successRate: number; // Calculated field
}
