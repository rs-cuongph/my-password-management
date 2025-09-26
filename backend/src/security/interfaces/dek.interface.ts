/**
 * Data Encryption Key (DEK) interfaces and types
 */

export interface DEKMetadata {
  /** Version for key rotation support */
  version: number;
  /** Timestamp when DEK was created */
  createdAt: Date;
  /** Algorithm used for wrapping */
  algorithm: 'xchacha20-poly1305';
  /** Key derivation function parameters */
  kdf?: {
    algorithm: string;
    salt: string;
    iterations?: number;
  };
}

export interface WrappedDEK {
  /** The encrypted DEK */
  encryptedDEK: string;
  /** Nonce used for encryption */
  nonce: string;
  /** Authentication tag */
  tag: string;
  /** Metadata about the key */
  metadata: DEKMetadata;
}

export interface DEKResult {
  /** The raw DEK bytes */
  dek: Uint8Array;
  /** Metadata about the key */
  metadata: DEKMetadata;
}

export interface DEKGenerationOptions {
  /** Version for key rotation (default: 1) */
  version?: number;
  /** Additional authenticated data */
  aad?: string;
}

export interface DEKWrapOptions {
  /** Version for key rotation (default: 1) */
  version?: number;
  /** Additional authenticated data */
  aad?: string;
  /** Custom nonce (will be generated if not provided) */
  nonce?: Uint8Array;
}

export interface DEKUnwrapOptions {
  /** Additional authenticated data (must match wrap operation) */
  aad?: string;
}

export interface KeyRotationInfo {
  /** Current key version */
  currentVersion: number;
  /** Available key versions */
  availableVersions: number[];
  /** Whether rotation is needed */
  rotationNeeded: boolean;
}

/**
 * Secure memory operations interface
 */
export interface SecureMemory {
  /** Clear sensitive data from memory */
  clear(): void;
  /** Check if memory has been cleared */
  isCleared(): boolean;
}

/**
 * DEK service interface
 */
export interface IDEKService {
  /**
   * Generate a new 256-bit DEK
   */
  generateDEK(options?: DEKGenerationOptions): Promise<DEKResult>;

  /**
   * Wrap a DEK with a master key using XChaCha20-Poly1305
   */
  wrapDEK(
    dek: Uint8Array,
    masterKey: Uint8Array,
    options?: DEKWrapOptions,
  ): Promise<WrappedDEK>;

  /**
   * Unwrap a DEK using the master key
   */
  unwrapDEK(
    wrappedDEK: WrappedDEK,
    masterKey: Uint8Array,
    options?: DEKUnwrapOptions,
  ): Promise<DEKResult>;

  /**
   * Get key rotation information
   */
  getKeyRotationInfo(wrappedDEKs: WrappedDEK[]): KeyRotationInfo;

  /**
   * Rotate a DEK to a new version
   */
  rotateDEK(
    wrappedDEK: WrappedDEK,
    oldMasterKey: Uint8Array,
    newMasterKey: Uint8Array,
    newVersion?: number,
  ): Promise<WrappedDEK>;

  /**
   * Clear sensitive data from memory
   */
  clearMemory(data: Uint8Array | Uint8Array[]): void;
}