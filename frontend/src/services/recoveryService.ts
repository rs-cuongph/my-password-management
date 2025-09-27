import { api } from './api';
import type {
  GenerateRecoveryCodeResponse,
  ValidateRecoveryCodeResponse,
  RecoverDEKResponse,
  RecoveryCodeStats,
} from '../types/recovery';

export interface GenerateRecoveryCodeRequest {
  dek: string; // Base64-encoded DEK
}

export interface ValidateRecoveryCodeRequest {
  recoveryCode: string;
  salt: string;
  derivationParams?: {
    opsLimit?: number;
    memLimit?: number;
    algorithm?: number;
  };
}

export interface RecoverDEKRequest {
  recoveryCode: string;
  salt: string;
  encryptedDEK: string;
  nonce: string;
  tag: string;
  derivationParams?: {
    opsLimit?: number;
    memLimit?: number;
    algorithm?: number;
  };
}

class RecoveryService {
  private readonly baseUrl = '/security/recovery-code';

  /**
   * Generate recovery code for a DEK
   */
  async generateRecoveryCode(
    request: GenerateRecoveryCodeRequest
  ): Promise<GenerateRecoveryCodeResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/generate`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Recovery code generation failed'
      );
    }
  }

  /**
   * Validate recovery code format and derivation
   */
  async validateRecoveryCode(
    request: ValidateRecoveryCodeRequest
  ): Promise<ValidateRecoveryCodeResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/validate`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Recovery code validation failed'
      );
    }
  }

  /**
   * Recover DEK using recovery code
   */
  async recoverDEK(request: RecoverDEKRequest): Promise<RecoverDEKResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/recover-dek`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'DEK recovery failed');
    }
  }

  /**
   * Get recovery code statistics
   */
  async getStats(): Promise<RecoveryCodeStats> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to get recovery stats'
      );
    }
  }

  /**
   * Format recovery code with proper spacing for display
   */
  formatRecoveryCode(code: string): string {
    // Remove any existing hyphens
    const cleanCode = code.replace(/-/g, '');

    // Validate length
    if (cleanCode.length !== 32) {
      return code; // Return as-is if invalid
    }

    // Format with hyphens: XXXX-XXXX-XXXX-XXXX
    return `${cleanCode.substring(0, 8)}-${cleanCode.substring(8, 16)}-${cleanCode.substring(16, 24)}-${cleanCode.substring(24, 32)}`;
  }

  /**
   * Validate recovery code format on the client side
   */
  validateCodeFormat(code: string): { valid: boolean; error?: string } {
    if (!code || code.trim() === '') {
      return { valid: false, error: 'Recovery code is required' };
    }

    // Remove spaces and hyphens for validation
    const cleanCode = code.replace(/[\s-]/g, '').toUpperCase();

    // Check length (should be 32 characters)
    if (cleanCode.length !== 32) {
      return {
        valid: false,
        error: 'Recovery code must be 32 characters long',
      };
    }

    // Check if it contains only valid Base32 characters (no 0, 1, 8, 9)
    const base32Pattern = /^[A-Z2-7]+$/;
    if (!base32Pattern.test(cleanCode)) {
      return {
        valid: false,
        error: 'Recovery code contains invalid characters',
      };
    }

    return { valid: true };
  }

  /**
   * Clean recovery code input (remove spaces, convert to uppercase)
   */
  cleanRecoveryCode(code: string): string {
    return code
      .replace(/[\s-]/g, '') // Remove spaces and hyphens
      .toUpperCase() // Convert to uppercase
      .replace(/[OQ]/g, '0') // Common misreadings: O -> 0, Q -> 0 (but 0 is not valid in base32)
      .replace(/[IL]/g, '1'); // Common misreadings: I -> 1, L -> 1 (but 1 is not valid in base32)
  }

  /**
   * Get user-friendly error message for recovery failures
   */
  getRecoveryErrorMessage(context?: RecoverDEKResponse['context']): string {
    if (!context) {
      return 'Recovery failed. Please check your recovery code and try again.';
    }

    if (!context.codeFormatValid) {
      return 'Invalid recovery code format. Please check that you entered it correctly.';
    }

    if (!context.saltValid) {
      return 'Invalid recovery data. Please make sure you have the correct recovery information.';
    }

    if (!context.keyDerivationSucceeded) {
      return 'Failed to process recovery code. The code may be incorrect or corrupted.';
    }

    if (!context.unwrappingSucceeded) {
      return 'Recovery code is valid but cannot unlock the vault. The code may not match this vault or the data may be corrupted.';
    }

    return 'Recovery failed due to an unknown error. Please try again or contact support.';
  }
}

export const recoveryService = new RecoveryService();
