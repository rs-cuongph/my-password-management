// Export all services
export { apiService, api } from './api';
export * from './authService';
export { vaultService } from './vaultService';
export { vaultPayloadService } from './vaultPayloadService';
export { dekService } from './dekService';
export { recoveryService } from './recoveryService';

// Re-export types
export type {
  VaultSyncStatus,
  VaultLoadResult,
  VaultSaveResult,
  VaultVersionCheckResult,
  ServerVaultData,
  VaultConflict,
} from './vaultService';

export type {
  EncryptVaultPayloadRequest,
  EncryptVaultPayloadResponse,
  DecryptVaultPayloadRequest,
  DecryptVaultPayloadResponse,
  EncryptVaultWithPasswordRequest,
  EncryptVaultWithPasswordResponse,
  DecryptVaultWithPasswordRequest,
  ReencryptVaultPayloadRequest,
  GetVaultStatsRequest,
  GetVaultStatsResponse,
} from './vaultPayloadService';

export type {
  DEKMetadata,
  WrappedDEK,
  GenerateDEKRequest,
  GenerateDEKResponse,
  WrapDEKRequest,
  WrapDEKResponse,
  UnwrapDEKRequest,
  UnwrapDEKResponse,
  KeyRotationInfo,
  GetKeyRotationInfoRequest,
  GetKeyRotationInfoResponse,
  RotateDEKRequest,
  RotateDEKResponse,
  GenerateMasterKeyResponse,
  DeriveMasterKeyRequest,
  DeriveMasterKeyResponse,
} from './dekService';

export type {
  GenerateRecoveryCodeRequest,
  ValidateRecoveryCodeRequest,
  RecoverDEKRequest,
} from './recoveryService';