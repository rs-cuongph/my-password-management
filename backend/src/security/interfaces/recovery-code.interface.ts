/**
 * Recovery Code Interface Definitions
 *
 * This file defines TypeScript interfaces for the recovery code system
 * that allows users to recover their vault without the master password.
 */

export interface RecoveryCode {
  /** Formatted recovery code with hyphens (e.g., "XXXX-XXXX-XXXX-XXXX") */
  code: string;

  /** Raw recovery code without formatting (for cryptographic operations) */
  rawCode: string;

  /** Base64-encoded salt for key derivation */
  salt: string;

  /** When the recovery code was created */
  createdAt: Date;

  /** Format version for future compatibility */
  version: number;
}

export interface RecoveryCodeWrappedDEK {
  /** Base64-encoded encrypted DEK */
  encryptedDEK: string;

  /** Base64-encoded nonce (24 bytes for XChaCha20-Poly1305) */
  nonce: string;

  /** Base64-encoded authentication tag (16 bytes) */
  tag: string;

  /** Metadata about the wrapped DEK */
  metadata: {
    /** Format version */
    version: number;

    /** Creation timestamp */
    createdAt: Date;

    /** Encryption algorithm used */
    algorithm: 'xchacha20-poly1305';

    /** Purpose indicator */
    purpose: 'recovery';
  };
}

export interface RecoveryKeyDerivation {
  /** Operations limit for Argon2id (computational cost) */
  opsLimit?: number;

  /** Memory limit for Argon2id (memory cost in bytes) */
  memLimit?: number;

  /** Argon2 algorithm variant */
  algorithm?: number;
}

export interface GenerateRecoveryCodeResult {
  /** The generated recovery code with metadata */
  recoveryCode: RecoveryCode;

  /** DEK wrapped with the recovery key */
  wrappedDEK: RecoveryCodeWrappedDEK;

  /** User instructions for handling the recovery code */
  instructions: string[];
}

export interface RecoveryCodeValidationResult {
  /** Whether the recovery code is valid */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;

  /** Derived recovery key if validation succeeded */
  recoveryKey?: Uint8Array;
}

export interface RecoveryFlowResult {
  /** Whether the recovery was successful */
  success: boolean;

  /** Unwrapped DEK if recovery succeeded */
  dek?: Uint8Array;

  /** Error message if recovery failed */
  error?: string;

  /** Additional context about the failure */
  context?: {
    /** Whether the recovery code format was valid */
    codeFormatValid?: boolean;

    /** Whether the salt was valid */
    saltValid?: boolean;

    /** Whether key derivation succeeded */
    keyDerivationSucceeded?: boolean;

    /** Whether DEK unwrapping succeeded */
    unwrappingSucceeded?: boolean;
  };
}

export interface RecoveryCodeStats {
  /** Total recovery codes generated */
  totalGenerated: number;

  /** Successful recovery attempts */
  successfulRecoveries: number;

  /** Failed recovery attempts */
  failedRecoveries: number;

  /** Most recent recovery code generation */
  lastGenerated?: Date;

  /** Most recent recovery attempt */
  lastRecoveryAttempt?: Date;
}