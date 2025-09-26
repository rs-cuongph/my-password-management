import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class KDFParametersDto {
  @IsString()
  algorithm: string;

  @IsString()
  salt: string;

  @IsOptional()
  @IsNumber()
  iterations?: number;
}

export class DEKMetadataDto {
  @IsNumber()
  version: number;

  @IsString()
  createdAt: string;

  @IsString()
  algorithm: 'xchacha20-poly1305';

  @IsOptional()
  @ValidateNested()
  @Type(() => KDFParametersDto)
  kdf?: KDFParametersDto;
}

export class WrappedDEKDto {
  @IsString()
  encryptedDEK: string;

  @IsString()
  nonce: string;

  @IsString()
  tag: string;

  @ValidateNested()
  @Type(() => DEKMetadataDto)
  metadata: DEKMetadataDto;
}

export class GenerateDEKRequestDto {
  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsString()
  aad?: string;
}

export class GenerateDEKResponseDto {
  @IsString()
  dek: string; // Base64 encoded

  @ValidateNested()
  @Type(() => DEKMetadataDto)
  metadata: DEKMetadataDto;
}

export class WrapDEKRequestDto {
  @IsString()
  dek: string; // Base64 encoded

  @IsString()
  masterKey: string; // Base64 encoded

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsString()
  aad?: string;

  @IsOptional()
  @IsString()
  nonce?: string; // Base64 encoded
}

export class WrapDEKResponseDto {
  @ValidateNested()
  @Type(() => WrappedDEKDto)
  wrappedDEK: WrappedDEKDto;
}

export class UnwrapDEKRequestDto {
  @ValidateNested()
  @Type(() => WrappedDEKDto)
  wrappedDEK: WrappedDEKDto;

  @IsString()
  masterKey: string; // Base64 encoded

  @IsOptional()
  @IsString()
  aad?: string;
}

export class UnwrapDEKResponseDto {
  @IsString()
  dek: string; // Base64 encoded

  @ValidateNested()
  @Type(() => DEKMetadataDto)
  metadata: DEKMetadataDto;
}

export class KeyRotationInfoDto {
  @IsNumber()
  currentVersion: number;

  @IsArray()
  @IsNumber({}, { each: true })
  availableVersions: number[];

  @IsBoolean()
  rotationNeeded: boolean;
}

export class GetKeyRotationInfoRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WrappedDEKDto)
  wrappedDEKs: WrappedDEKDto[];
}

export class GetKeyRotationInfoResponseDto {
  @ValidateNested()
  @Type(() => KeyRotationInfoDto)
  rotationInfo: KeyRotationInfoDto;
}

export class RotateDEKRequestDto {
  @ValidateNested()
  @Type(() => WrappedDEKDto)
  wrappedDEK: WrappedDEKDto;

  @IsString()
  oldMasterKey: string; // Base64 encoded

  @IsString()
  newMasterKey: string; // Base64 encoded

  @IsOptional()
  @IsNumber()
  newVersion?: number;
}

export class RotateDEKResponseDto {
  @ValidateNested()
  @Type(() => WrappedDEKDto)
  wrappedDEK: WrappedDEKDto;
}
