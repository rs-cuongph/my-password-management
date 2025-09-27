import { api } from './api';

// Types matching backend DTOs
export interface DEKMetadata {
  version: number;
  createdAt: string; // ISO string
  algorithm: 'xchacha20-poly1305';
  kdf?: string;
}

export interface WrappedDEK {
  encryptedDEK: string;
  nonce: string;
  tag: string;
  metadata: DEKMetadata;
}

export interface GenerateDEKRequest {
  version?: number;
  aad?: string; // Additional authenticated data
}

export interface GenerateDEKResponse {
  dek: string; // Base64-encoded DEK
  metadata: DEKMetadata;
}

export interface WrapDEKRequest {
  dek: string; // Base64-encoded DEK
  masterKey: string; // Base64-encoded master key
  version?: number;
  aad?: string;
  nonce?: string; // Base64-encoded nonce (optional)
}

export interface WrapDEKResponse {
  wrappedDEK: WrappedDEK;
}

export interface UnwrapDEKRequest {
  wrappedDEK: WrappedDEK;
  masterKey: string; // Base64-encoded master key
  aad?: string;
}

export interface UnwrapDEKResponse {
  dek: string; // Base64-encoded DEK
  metadata: DEKMetadata;
}

export interface KeyRotationInfo {
  currentVersion: number;
  availableVersions: number[];
  rotationNeeded: boolean;
}

export interface GetKeyRotationInfoRequest {
  wrappedDEKs: WrappedDEK[];
}

export interface GetKeyRotationInfoResponse {
  rotationInfo: KeyRotationInfo;
}

export interface RotateDEKRequest {
  wrappedDEK: WrappedDEK;
  oldMasterKey: string; // Base64-encoded old master key
  newMasterKey: string; // Base64-encoded new master key
  newVersion: number;
}

export interface RotateDEKResponse {
  wrappedDEK: WrappedDEK;
}

export interface GenerateMasterKeyResponse {
  masterKey: string; // Base64-encoded master key
}

export interface DeriveMasterKeyRequest {
  password: string;
  salt?: string; // Base64-encoded salt (optional)
}

export interface DeriveMasterKeyResponse {
  masterKey: string; // Base64-encoded master key
  salt: string; // Base64-encoded salt
}

class DEKService {
  private readonly baseUrl = '/security/dek';

  /**
   * Generate a new Data Encryption Key (DEK)
   */
  async generateDEK(request: GenerateDEKRequest = {}): Promise<GenerateDEKResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/generate`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'DEK generation failed',
      );
    }
  }

  /**
   * Wrap DEK with master key for secure storage
   */
  async wrapDEK(request: WrapDEKRequest): Promise<WrapDEKResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/wrap`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'DEK wrapping failed',
      );
    }
  }

  /**
   * Unwrap DEK using master key
   */
  async unwrapDEK(request: UnwrapDEKRequest): Promise<UnwrapDEKResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/unwrap`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'DEK unwrapping failed',
      );
    }
  }

  /**
   * Get key rotation information
   */
  async getKeyRotationInfo(
    request: GetKeyRotationInfoRequest,
  ): Promise<GetKeyRotationInfoResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/rotation-info`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to get rotation info',
      );
    }
  }

  /**
   * Rotate DEK to new master key
   */
  async rotateDEK(request: RotateDEKRequest): Promise<RotateDEKResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/rotate`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'DEK rotation failed',
      );
    }
  }

  /**
   * Generate a new master key
   */
  async generateMasterKey(): Promise<GenerateMasterKeyResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/master-key/generate`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Master key generation failed',
      );
    }
  }

  /**
   * Derive master key from password
   */
  async deriveMasterKey(
    request: DeriveMasterKeyRequest,
  ): Promise<DeriveMasterKeyResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/master-key/derive`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Master key derivation failed',
      );
    }
  }

  /**
   * Helper: Generate DEK and wrap it with master key in one operation
   */
  async generateAndWrapDEK(
    masterKey: string,
    options: {
      version?: number;
      aad?: string;
    } = {},
  ): Promise<{ wrappedDEK: WrappedDEK; dek: string }> {
    try {
      // Generate new DEK
      const generateResult = await this.generateDEK({
        version: options.version,
        aad: options.aad,
      });

      // Wrap the DEK
      const wrapResult = await this.wrapDEK({
        dek: generateResult.dek,
        masterKey,
        version: options.version,
        aad: options.aad,
      });

      return {
        wrappedDEK: wrapResult.wrappedDEK,
        dek: generateResult.dek,
      };
    } catch (error: any) {
      throw new Error(
        error.message || 'Failed to generate and wrap DEK',
      );
    }
  }

  /**
   * Helper: Complete key rotation workflow
   */
  async rotateKeys(
    currentWrappedDEK: WrappedDEK,
    oldMasterKey: string,
    newPassword: string,
    salt?: string,
  ): Promise<{
    newWrappedDEK: WrappedDEK;
    newMasterKey: string;
    salt: string;
  }> {
    try {
      // Derive new master key from password
      const derivationResult = await this.deriveMasterKey({
        password: newPassword,
        salt,
      });

      // Rotate DEK to new master key
      const rotationResult = await this.rotateDEK({
        wrappedDEK: currentWrappedDEK,
        oldMasterKey,
        newMasterKey: derivationResult.masterKey,
        newVersion: currentWrappedDEK.metadata.version + 1,
      });

      return {
        newWrappedDEK: rotationResult.wrappedDEK,
        newMasterKey: derivationResult.masterKey,
        salt: derivationResult.salt,
      };
    } catch (error: any) {
      throw new Error(
        error.message || 'Key rotation workflow failed',
      );
    }
  }

  /**
   * Helper: Check if keys need rotation
   */
  async shouldRotateKeys(wrappedDEKs: WrappedDEK[]): Promise<{
    shouldRotate: boolean;
    reason?: string;
    rotationInfo: KeyRotationInfo;
  }> {
    try {
      const rotationInfo = await this.getKeyRotationInfo({ wrappedDEKs });

      if (rotationInfo.rotationInfo.rotationNeeded) {
        return {
          shouldRotate: true,
          reason: 'Backend recommends key rotation',
          rotationInfo: rotationInfo.rotationInfo,
        };
      }

      // Check for version differences
      const versions = rotationInfo.rotationInfo.availableVersions;
      const hasOldVersions = versions.some(v => v < rotationInfo.rotationInfo.currentVersion);

      if (hasOldVersions) {
        return {
          shouldRotate: true,
          reason: 'Mixed key versions detected',
          rotationInfo: rotationInfo.rotationInfo,
        };
      }

      return {
        shouldRotate: false,
        rotationInfo: rotationInfo.rotationInfo,
      };
    } catch (error: any) {
      throw new Error(
        error.message || 'Failed to check rotation status',
      );
    }
  }

  /**
   * Helper: Validate wrapped DEK structure
   */
  validateWrappedDEK(wrappedDEK: any): wrappedDEK is WrappedDEK {
    return (
      wrappedDEK &&
      typeof wrappedDEK.encryptedDEK === 'string' &&
      typeof wrappedDEK.nonce === 'string' &&
      typeof wrappedDEK.tag === 'string' &&
      wrappedDEK.metadata &&
      typeof wrappedDEK.metadata.version === 'number' &&
      typeof wrappedDEK.metadata.createdAt === 'string' &&
      wrappedDEK.metadata.algorithm === 'xchacha20-poly1305'
    );
  }

  /**
   * Helper: Convert wrapped DEK for API calls
   */
  convertWrappedDEKForApi(wrappedDEK: WrappedDEK): any {
    return {
      encryptedDEK: wrappedDEK.encryptedDEK,
      nonce: wrappedDEK.nonce,
      tag: wrappedDEK.tag,
      metadata: {
        version: wrappedDEK.metadata.version,
        createdAt: wrappedDEK.metadata.createdAt,
        algorithm: wrappedDEK.metadata.algorithm,
        kdf: wrappedDEK.metadata.kdf,
      },
    };
  }
}

// Export singleton instance
export const dekService = new DEKService();
export default dekService;