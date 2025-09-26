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
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VaultEntryDto {
  @ApiProperty({ description: 'Unique entry identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Entry title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Entry description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Entry status',
    enum: ['todo', 'in-progress', 'done'],
  })
  @IsIn(['todo', 'in-progress', 'done'])
  status: 'todo' | 'in-progress' | 'done';

  @ApiProperty({
    description: 'Entry priority',
    enum: ['low', 'medium', 'high'],
  })
  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Entry tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Assigned user' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({ description: 'Creation date' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class VaultBoardDto {
  @ApiProperty({ description: 'Unique board identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Board name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Board description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Board columns' })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiPropertyOptional({ description: 'Board settings' })
  @IsOptional()
  @IsObject()
  settings?: {
    color?: string;
    archived?: boolean;
    starred?: boolean;
  };

  @ApiProperty({ description: 'Creation date' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class VaultMetadataDto {
  @ApiProperty({ description: 'Vault format version' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Last synchronization date' })
  @IsDate()
  @Type(() => Date)
  lastSyncAt: Date;

  @ApiProperty({ description: 'Number of entries' })
  @IsNumber()
  @Min(0)
  entryCount: number;

  @ApiProperty({ description: 'Number of boards' })
  @IsNumber()
  @Min(0)
  boardCount: number;

  @ApiPropertyOptional({ description: 'Data integrity checksum' })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Synchronization identifier' })
  @IsOptional()
  @IsString()
  syncId?: string;
}

export class VaultPayloadDto {
  @ApiProperty({ description: 'Vault entries', type: [VaultEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultEntryDto)
  entries: VaultEntryDto[];

  @ApiProperty({ description: 'Vault boards', type: [VaultBoardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultBoardDto)
  boards: VaultBoardDto[];

  @ApiProperty({ description: 'Vault metadata', type: VaultMetadataDto })
  @ValidateNested()
  @Type(() => VaultMetadataDto)
  metadata: VaultMetadataDto;
}

export class EncryptedVaultPayloadDto {
  @ApiProperty({ description: 'Base64-encoded encrypted data' })
  @IsString()
  encryptedData: string;

  @ApiProperty({ description: 'Base64-encoded nonce' })
  @IsString()
  nonce: string;

  @ApiProperty({ description: 'Base64-encoded authentication tag' })
  @IsString()
  tag: string;

  @ApiProperty({ description: 'Whether data was compressed' })
  @IsBoolean()
  compressed: boolean;

  @ApiProperty({
    description: 'Encryption algorithm',
    enum: ['xchacha20-poly1305'],
  })
  @IsIn(['xchacha20-poly1305'])
  algorithm: 'xchacha20-poly1305';

  @ApiProperty({ description: 'Encryption format version' })
  @IsNumber()
  @Min(1)
  version: number;

  @ApiProperty({ description: 'Encryption timestamp' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class VaultEncryptionOptionsDto {
  @ApiPropertyOptional({ description: 'Enable compression', default: true })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({ description: 'Compression level (1-9)', default: 6 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  compressionLevel?: number;

  @ApiPropertyOptional({ description: 'Additional authenticated data' })
  @IsOptional()
  @IsString()
  aad?: string;

  @ApiPropertyOptional({
    description: 'Force compression even if minimal savings',
  })
  @IsOptional()
  @IsBoolean()
  forceCompression?: boolean;
}

export class VaultDecryptionOptionsDto {
  @ApiPropertyOptional({ description: 'Additional authenticated data' })
  @IsOptional()
  @IsString()
  aad?: string;

  @ApiPropertyOptional({
    description: 'Maximum payload size after decompression (bytes)',
    default: 52428800,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPayloadSize?: number;

  @ApiPropertyOptional({ description: 'Enable strict validation' })
  @IsOptional()
  @IsBoolean()
  strictValidation?: boolean;
}

// Request DTOs
export class EncryptVaultPayloadRequestDto {
  @ApiProperty({
    description: 'Vault payload to encrypt',
    type: VaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @ApiProperty({ description: 'Base64-encoded DEK for encryption' })
  @IsString()
  dek: string;

  @ApiPropertyOptional({
    description: 'Encryption options',
    type: VaultEncryptionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

export class DecryptVaultPayloadRequestDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ApiProperty({ description: 'Base64-encoded DEK for decryption' })
  @IsString()
  dek: string;

  @ApiPropertyOptional({
    description: 'Decryption options',
    type: VaultDecryptionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VaultDecryptionOptionsDto)
  options?: VaultDecryptionOptionsDto;
}

export class EncryptVaultWithPasswordRequestDto {
  @ApiProperty({
    description: 'Vault payload to encrypt',
    type: VaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @ApiProperty({ description: 'Master password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Base64-encoded salt for key derivation' })
  @IsString()
  salt: string;

  @ApiPropertyOptional({
    description: 'Encryption options',
    type: VaultEncryptionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

export class DecryptVaultWithPasswordRequestDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ApiProperty({ description: 'Wrapped DEK data' })
  @IsObject()
  wrappedDEK: any; // WrappedDEKDto would be imported from dek.dto.ts

  @ApiProperty({ description: 'Master password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Base64-encoded salt for key derivation' })
  @IsString()
  salt: string;

  @ApiPropertyOptional({
    description: 'Decryption options',
    type: VaultDecryptionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VaultDecryptionOptionsDto)
  options?: VaultDecryptionOptionsDto;
}

export class ReencryptVaultPayloadRequestDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ApiProperty({ description: 'Base64-encoded old DEK' })
  @IsString()
  oldDEK: string;

  @ApiProperty({ description: 'Base64-encoded new DEK' })
  @IsString()
  newDEK: string;

  @ApiPropertyOptional({
    description: 'Encryption options',
    type: VaultEncryptionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VaultEncryptionOptionsDto)
  options?: VaultEncryptionOptionsDto;
}

// Response DTOs
export class VaultEncryptionStatsDto {
  @ApiProperty({ description: 'Original payload size in bytes' })
  @IsNumber()
  originalSize: number;

  @ApiPropertyOptional({ description: 'Compressed size in bytes' })
  @IsOptional()
  @IsNumber()
  compressedSize?: number;

  @ApiProperty({ description: 'Encrypted data size in bytes' })
  @IsNumber()
  encryptedSize: number;

  @ApiPropertyOptional({ description: 'Compression ratio' })
  @IsOptional()
  @IsNumber()
  compressionRatio?: number;

  @ApiProperty({ description: 'Encryption time in milliseconds' })
  @IsNumber()
  encryptionTime: number;

  @ApiProperty({ description: 'Whether compression was used' })
  @IsBoolean()
  compressed: boolean;
}

export class EncryptVaultPayloadResponseDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ApiProperty({
    description: 'Encryption statistics',
    type: VaultEncryptionStatsDto,
  })
  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}

export class DecryptVaultPayloadResponseDto {
  @ApiProperty({
    description: 'Decrypted vault payload',
    type: VaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => VaultPayloadDto)
  payload: VaultPayloadDto;

  @ApiPropertyOptional({
    description: 'Compression ratio if compression was used',
  })
  @IsOptional()
  @IsNumber()
  compressionRatio?: number;

  @ApiProperty({ description: 'Decryption time in milliseconds' })
  @IsNumber()
  decryptionTime: number;

  @ApiPropertyOptional({ description: 'Warnings during decryption' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];
}

export class EncryptVaultWithPasswordResponseDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;

  @ApiProperty({ description: 'Wrapped DEK' })
  @IsObject()
  wrappedDEK: any; // WrappedDEKDto

  @ApiProperty({
    description: 'Encryption statistics',
    type: VaultEncryptionStatsDto,
  })
  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}

export class GetVaultStatsRequestDto {
  @ApiProperty({
    description: 'Encrypted vault payload',
    type: EncryptedVaultPayloadDto,
  })
  @ValidateNested()
  @Type(() => EncryptedVaultPayloadDto)
  encryptedPayload: EncryptedVaultPayloadDto;
}

export class GetVaultStatsResponseDto {
  @ApiProperty({
    description: 'Encryption statistics',
    type: VaultEncryptionStatsDto,
  })
  @ValidateNested()
  @Type(() => VaultEncryptionStatsDto)
  stats: VaultEncryptionStatsDto;
}
