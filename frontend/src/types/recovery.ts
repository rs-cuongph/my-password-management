/**
 * Recovery Code Types for Frontend
 */

export interface RecoveryCode {
  /** Formatted recovery code with hyphens (e.g., "XXXX-XXXX-XXXX-XXXX") */
  code: string;
  /** Base64-encoded salt for key derivation */
  salt: string;
  /** When the recovery code was created */
  createdAt: string;
  /** Format version for future compatibility */
  version: number;
  /** User instructions for handling the recovery code */
  instructions: string[];
}

export interface RecoveryWrappedDEK {
  /** Base64-encoded encrypted DEK */
  encryptedDEK: string;
  /** Base64-encoded nonce (24 bytes for XChaCha20-Poly1305) */
  nonce: string;
  /** Base64-encoded authentication tag (16 bytes) */
  tag: string;
  /** Metadata about the wrapped DEK */
  metadata: {
    version: number;
    createdAt: string;
    algorithm: 'xchacha20-poly1305';
    purpose: 'recovery';
  };
}

export interface GenerateRecoveryCodeResponse {
  recoveryCode: RecoveryCode;
  wrappedDEK: RecoveryWrappedDEK;
  success: boolean;
  message?: string;
}

export interface ValidateRecoveryCodeResponse {
  valid: boolean;
  error?: string;
  message?: string;
}

export interface RecoverDEKResponse {
  success: boolean;
  dek?: string;
  error?: string;
  context?: {
    codeFormatValid?: boolean;
    saltValid?: boolean;
    keyDerivationSucceeded?: boolean;
    unwrappingSucceeded?: boolean;
  };
}

export interface RecoveryCodeStats {
  totalGenerated: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  lastGenerated?: string;
  lastRecoveryAttempt?: string;
  successRate: number;
}

export interface RecoveryFlowState {
  step: 'input' | 'validating' | 'recovering' | 'success' | 'error';
  recoveryCode: string;
  error?: string;
  context?: {
    codeFormatValid?: boolean;
    saltValid?: boolean;
    keyDerivationSucceeded?: boolean;
    unwrappingSucceeded?: boolean;
  };
}

export interface RecoveryCodeDisplayProps {
  recoveryCode: RecoveryCode;
  onClose: () => void;
  onGenerate?: () => void;
}

export interface RecoveryFlowProps {
  wrappedDEK: RecoveryWrappedDEK;
  salt: string;
  onSuccess: (dek: string) => void;
  onCancel: () => void;
}