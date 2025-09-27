import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsDate,
  IsIn,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VaultEntryDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['todo', 'in-progress', 'done'])
  status: 'todo' | 'in-progress' | 'done';

  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PasswordEntryDto {
  @IsString()
  id: string;

  @IsString()
  site: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  hint?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastUsed?: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class VaultBoardDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class VaultMetadataDto {
  @IsString()
  version: string;

  @IsDate()
  @Type(() => Date)
  lastSyncAt: Date;

  @IsNumber()
  @Min(0)
  entriesCount: number;

  @IsNumber()
  @Min(0)
  boardsCount: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @IsString()
  syncId?: string;
}

export class VaultPayloadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultEntryDto)
  entries: VaultEntryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasswordEntryDto)
  passwordEntries?: PasswordEntryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultBoardDto)
  boards: VaultBoardDto[];

  @ValidateNested()
  @Type(() => VaultMetadataDto)
  metadata: VaultMetadataDto;
}

export class EncryptedVaultPayloadDto {
  @IsString()
  encryptedData: string;

  @IsString()
  nonce: string;

  @IsString()
  tag: string;

  @IsBoolean()
  compressed: boolean;

  @IsIn(['xchacha20-poly1305'])
  algorithm: 'xchacha20-poly1305';

  @IsNumber()
  @Min(1)
  version: number;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class VaultEncryptionOptionsDto {
  @IsOptional()
  @IsBoolean()
  compression?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  compressionLevel?: number;

  @IsOptional()
  @IsString()
  aad?: string;

  @IsOptional()
  @IsObject()
  customParams?: Record<string, any>;
}

export class VaultDecryptionOptionsDto {
  @IsOptional()
  @IsString()
  aad?: string;

  @IsOptional()
  @IsObject()
  customParams?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  strictValidation?: boolean;
}

// Request DTOs
export class EncryptVaultPayloadRequestDto {
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @IsString()
  dek: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

export class DecryptVaultPayloadRequestDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @IsString()
  dek: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VaultDecryptionOptionsDto)
  options?: VaultDecryptionOptionsDto;
}

export class EncryptVaultWithPasswordRequestDto {
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @IsString()
  password: string;

  @IsString()
  salt: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

export class DecryptVaultWithPasswordRequestDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @IsString()
  wrappedDEK: string;

  @IsString()
  password: string;

  @IsString()
  salt: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VaultDecryptionOptionsDto)
  options?: VaultDecryptionOptionsDto;
}

export class ReencryptVaultPayloadRequestDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @IsString()
  oldDEK: string;

  @IsString()
  newDEK: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

export class GetVaultStatsRequestDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;
}

// Response DTOs
export class VaultEncryptionStatsDto {
  @IsNumber()
  originalSize: number;

  @IsOptional()
  @IsNumber()
  compressedSize?: number;

  @IsNumber()
  encryptedSize: number;

  @IsOptional()
  @IsNumber()
  compressionRatio?: number;

  @IsNumber()
  encryptionTime: number;

  @IsBoolean()
  compressed: boolean;
}

export class VaultDecryptionStatsDto {
  @IsNumber()
  decryptionTime: number;

  @IsOptional()
  @IsNumber()
  compressionRatio?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];
}

export class EncryptVaultPayloadResponseDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}

export class DecryptVaultPayloadResponseDto {
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @ValidateNested()
  @Type(() => VaultDecryptionStatsDto)
  stats: VaultDecryptionStatsDto;
}

export class EncryptVaultWithPasswordResponseDto {
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @IsString()
  wrappedDEK: string;

  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}

export class GetVaultStatsResponseDto {
  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}
