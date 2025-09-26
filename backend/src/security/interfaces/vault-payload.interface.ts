/**
 * Vault Payload Encryption interfaces and types
 */

export interface VaultEntry {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>; // Extensible metadata for future features
}

export interface VaultBoard {
  id: string;
  name: string;
  description?: string;
  columns: string[];
  settings?: {
    color?: string;
    archived?: boolean;
    starred?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultMetadata {
  version: string;
  lastSyncAt: Date;
  entryCount: number;
  boardCount: number;
  checksum?: string; // Optional integrity check
  syncId?: string; // For synchronization tracking
}

export interface VaultPayload {
  entries: VaultEntry[];
  boards: VaultBoard[];
  metadata: VaultMetadata;
}

export interface EncryptedVaultPayload {
  /** Base64-encoded encrypted payload */
  encryptedData: string;
  /** Base64-encoded XChaCha20 nonce (24 bytes) */
  nonce: string;
  /** Base64-encoded Poly1305 tag (16 bytes) */
  tag: string;
  /** Whether the data was compressed before encryption */
  compressed: boolean;
  /** Encryption algorithm used */
  algorithm: 'xchacha20-poly1305';
  /** Encryption format version */
  version: number;
  /** When the encryption was performed */
  createdAt: Date;
}

export interface VaultDecryptionResult {
  /** The decrypted vault payload */
  payload: VaultPayload;
  /** Compression ratio if compression was used */
  compressionRatio?: number;
  /** Time taken for decryption in milliseconds */
  decryptionTime: number;
  /** Any warnings during decryption */
  warnings?: string[];
}

export interface VaultEncryptionOptions {
  /** Enable compression (default: true) */
  compress?: boolean;
  /** Compression level 1-9 (default: 6) */
  compressionLevel?: number;
  /** Additional authenticated data */
  aad?: string;
  /** Force compression even if size reduction is minimal */
  forceCompression?: boolean;
}

export interface VaultDecryptionOptions {
  /** Additional authenticated data (must match encryption) */
  aad?: string;
  /** Maximum allowed payload size after decompression (default: 50MB) */
  maxPayloadSize?: number;
  /** Strict validation of payload structure */
  strictValidation?: boolean;
}

export interface VaultEncryptionResult {
  /** The encrypted payload */
  encryptedPayload: EncryptedVaultPayload;
  /** Wrapped DEK used for encryption */
  wrappedDEK: any; // WrappedDEK from dek.interface.ts
  /** Encryption statistics */
  stats: VaultEncryptionStats;
}

export interface VaultEncryptionStats {
  /** Size of original payload in bytes */
  originalSize: number;
  /** Size after compression (if used) in bytes */
  compressedSize?: number;
  /** Size of encrypted data in bytes */
  encryptedSize: number;
  /** Compression ratio (compressed/original) */
  compressionRatio?: number;
  /** Time taken for encryption in milliseconds */
  encryptionTime: number;
  /** Whether compression was applied */
  compressed: boolean;
}

export interface VaultCorruptionError {
  /** Type of corruption detected */
  type:
    | 'authentication_failed'
    | 'decompression_failed'
    | 'json_parse_failed'
    | 'structure_invalid';
  /** Human-readable error message */
  message: string;
  /** Technical details for debugging */
  details?: any;
  /** Suggested recovery actions */
  recoveryHints?: string[];
}

/**
 * Interface for vault payload encryption service
 */
export interface IVaultPayloadService {
  /**
   * Encrypt vault payload with DEK
   */
  encryptPayload(
    payload: VaultPayload,
    dek: Uint8Array,
    options?: VaultEncryptionOptions,
  ): Promise<EncryptedVaultPayload>;

  /**
   * Decrypt vault payload with DEK
   */
  decryptPayload(
    encryptedPayload: EncryptedVaultPayload,
    dek: Uint8Array,
    options?: VaultDecryptionOptions,
  ): Promise<VaultDecryptionResult>;

  /**
   * Encrypt vault with password (convenience method)
   */
  encryptVaultWithPassword(
    payload: VaultPayload,
    password: string,
    salt: Uint8Array,
    options?: VaultEncryptionOptions,
  ): Promise<VaultEncryptionResult>;

  /**
   * Decrypt vault with password (convenience method)
   */
  decryptVaultWithPassword(
    encryptedPayload: EncryptedVaultPayload,
    wrappedDEK: any, // WrappedDEK
    password: string,
    salt: Uint8Array,
    options?: VaultDecryptionOptions,
  ): Promise<VaultDecryptionResult>;

  /**
   * Re-encrypt payload with new DEK (for key rotation)
   */
  reencryptPayload(
    encryptedPayload: EncryptedVaultPayload,
    oldDEK: Uint8Array,
    newDEK: Uint8Array,
    options?: VaultEncryptionOptions,
  ): Promise<EncryptedVaultPayload>;

  /**
   * Get encryption statistics
   */
  getEncryptionStats(
    encryptedPayload: EncryptedVaultPayload,
  ): VaultEncryptionStats;
}

/**
 * Vault payload validation rules
 */
export interface VaultPayloadValidationRules {
  /** Maximum number of entries allowed */
  maxEntries?: number;
  /** Maximum number of boards allowed */
  maxBoards?: number;
  /** Maximum size of individual entry title */
  maxEntryTitleLength?: number;
  /** Maximum size of individual entry description */
  maxEntryDescriptionLength?: number;
  /** Allowed entry statuses */
  allowedStatuses?: string[];
  /** Allowed entry priorities */
  allowedPriorities?: string[];
  /** Maximum payload size before encryption */
  maxPayloadSize?: number;
}

/**
 * Vault backup and restore operations
 */
export interface VaultBackupInfo {
  /** Backup identifier */
  backupId: string;
  /** When the backup was created */
  createdAt: Date;
  /** Size of the backup */
  size: number;
  /** Number of entries in backup */
  entryCount: number;
  /** Number of boards in backup */
  boardCount: number;
  /** Backup integrity hash */
  hash: string;
  /** Backup metadata */
  metadata: VaultMetadata;
}

export interface VaultRestoreOptions {
  /** Whether to merge with existing data */
  merge?: boolean;
  /** Conflict resolution strategy */
  conflictResolution?: 'newer' | 'older' | 'manual';
  /** Fields to exclude from restore */
  excludeFields?: string[];
  /** Validate restored data */
  validate?: boolean;
}

/**
 * Migration support for vault format upgrades
 */
export interface VaultMigration {
  /** Source version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Migration function */
  migrate: (payload: any) => VaultPayload;
  /** Validation function for migrated data */
  validate?: (payload: VaultPayload) => boolean;
  /** Migration description */
  description: string;
}

export interface VaultMigrationResult {
  /** Migration was successful */
  success: boolean;
  /** Original version */
  fromVersion: string;
  /** New version */
  toVersion: string;
  /** Any warnings during migration */
  warnings?: string[];
  /** Migration errors if failed */
  errors?: string[];
  /** Migrated payload */
  payload?: VaultPayload;
}
