import { api } from './api';
import type { VaultPayload, EncryptedVaultPayload } from '../utils/vaultCrypto';

// Request/Response types matching backend DTOs
export interface EncryptVaultPayloadRequest {
  dek: string; // Base64-encoded DEK
  payload: {
    entries: Array<{
      id: string;
      title: string;
      description?: string;
      status: 'todo' | 'in-progress' | 'done';
      priority: 'low' | 'medium' | 'high';
      tags?: string[];
      assignedTo?: string;
      dueDate?: string; // ISO string
      createdAt: string; // ISO string
      updatedAt: string; // ISO string
      metadata?: Record<string, any>;
    }>;
    passwordEntries?: Array<{
      id: string;
      site: string;
      username: string;
      password: string;
      hint?: string;
      url?: string;
      notes?: string;
      tags?: string[];
      createdAt: string; // ISO string
      updatedAt: string; // ISO string
      lastUsed?: string; // ISO string
      metadata?: Record<string, any>;
    }>;
    boards: Array<{
      id: string;
      name: string;
      description?: string;
      columns: string[];
      settings?: {
        color?: string;
        archived?: boolean;
        starred?: boolean;
      };
      createdAt: string; // ISO string
      updatedAt: string; // ISO string
    }>;
    metadata: {
      version: string;
      lastSyncAt: string; // ISO string
      entriesCount: number;
      boardsCount: number;
      checksum?: string;
      syncId?: string;
    };
  };
  options?: {
    compression?: boolean;
    integrity?: boolean;
  };
}

export interface EncryptVaultPayloadResponse {
  encryptedPayload: EncryptedVaultPayload;
  stats: {
    originalSize: number;
    encryptedSize: number;
    compressionRatio?: number;
    encryptionTime: number;
    compressed: boolean;
  };
}

export interface DecryptVaultPayloadRequest {
  dek: string; // Base64-encoded DEK
  encryptedPayload: {
    encryptedData: string;
    nonce: string;
    tag: string;
    compressed: boolean;
    checksum: string;
    createdAt: string; // ISO string
  };
  options?: {
    verifyIntegrity?: boolean;
  };
}

export interface DecryptVaultPayloadResponse {
  payload: VaultPayload;
  stats: {
    decryptionTime: number;
    compressionRatio?: number;
    warnings: string[];
  };
}

export interface EncryptVaultWithPasswordRequest {
  payload: EncryptVaultPayloadRequest['payload'];
  password: string;
  salt: string; // Base64-encoded salt
  options?: {
    compression?: boolean;
    integrity?: boolean;
    kdfParams?: {
      opsLimit?: number;
      memLimit?: number;
      algorithm?: number;
    };
  };
}

export interface EncryptVaultWithPasswordResponse {
  encryptedPayload: EncryptedVaultPayload;
  wrappedDEK: string; // JSON stringified WrappedDEK
  stats: {
    originalSize: number;
    encryptedSize: number;
    compressionRatio?: number;
    encryptionTime: number;
    compressed: boolean;
  };
}

export interface DecryptVaultWithPasswordRequest {
  encryptedPayload: DecryptVaultPayloadRequest['encryptedPayload'];
  wrappedDEK: string; // JSON stringified WrappedDEK
  password: string;
  salt: string; // Base64-encoded salt
  options?: {
    verifyIntegrity?: boolean;
    kdfParams?: {
      opsLimit?: number;
      memLimit?: number;
      algorithm?: number;
    };
  };
}

export interface ReencryptVaultPayloadRequest {
  encryptedPayload: DecryptVaultPayloadRequest['encryptedPayload'];
  oldDEK: string; // Base64-encoded old DEK
  newDEK: string; // Base64-encoded new DEK
  options?: {
    compression?: boolean;
    integrity?: boolean;
  };
}

export interface GetVaultStatsRequest {
  encryptedPayload: DecryptVaultPayloadRequest['encryptedPayload'];
}

export interface GetVaultStatsResponse {
  stats: {
    originalSize: number;
    encryptedSize: number;
    compressionRatio?: number;
    encryptionTime: number;
    compressed: boolean;
  };
}

class VaultPayloadService {
  private readonly baseUrl = '/security/vault-payload';

  /**
   * Encrypt vault payload with DEK
   */
  async encryptPayload(
    request: EncryptVaultPayloadRequest
  ): Promise<EncryptVaultPayloadResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/encrypt`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Vault encryption failed'
      );
    }
  }

  /**
   * Decrypt vault payload with DEK
   */
  async decryptPayload(
    request: DecryptVaultPayloadRequest
  ): Promise<DecryptVaultPayloadResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/decrypt`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Vault decryption failed'
      );
    }
  }

  /**
   * Encrypt vault with password (includes DEK generation and wrapping)
   */
  async encryptVaultWithPassword(
    request: EncryptVaultWithPasswordRequest
  ): Promise<EncryptVaultWithPasswordResponse> {
    try {
      const response = await api.post(
        `${this.baseUrl}/encrypt-with-password`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('EncryptVaultWithPassword error:', error.response?.data);
      throw new Error(
        error.response?.data?.message || 'Password encryption failed'
      );
    }
  }

  /**
   * Decrypt vault with password (includes DEK unwrapping)
   */
  async decryptVaultWithPassword(
    request: DecryptVaultWithPasswordRequest
  ): Promise<DecryptVaultPayloadResponse> {
    try {
      const response = await api.post(
        `${this.baseUrl}/decrypt-with-password`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Password decryption failed'
      );
    }
  }

  /**
   * Re-encrypt vault payload with new DEK (key rotation)
   */
  async reencryptPayload(
    request: ReencryptVaultPayloadRequest
  ): Promise<EncryptVaultPayloadResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/reencrypt`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Vault re-encryption failed'
      );
    }
  }

  /**
   * Get encryption statistics for vault payload
   */
  async getVaultStats(
    request: GetVaultStatsRequest
  ): Promise<GetVaultStatsResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/stats`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to get vault statistics'
      );
    }
  }

  /**
   * Helper: Convert VaultPayload to API format
   */
  convertVaultPayloadToApiFormat(
    payload: VaultPayload
  ): EncryptVaultPayloadRequest['payload'] {
    return {
      entries:
        payload.entries?.map((entry) => ({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          status: entry.status,
          priority: entry.priority,
          tags: entry.tags,
          assignedTo: entry.assignedTo,
          dueDate: entry.dueDate?.toISOString(),
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          metadata: entry.metadata,
        })) || [],
      passwordEntries:
        payload.passwordEntries?.map((entry) => ({
          id: entry.id,
          site: entry.site,
          username: entry.username,
          password: entry.password,
          hint: entry.hint,
          url: entry.url,
          notes: entry.notes,
          tags: entry.tags,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          lastUsed: entry.lastUsed?.toISOString(),
          metadata: entry.metadata,
        })) || [],
      boards:
        payload.boards?.map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          columns: board.columns,
          settings: board.settings,
          createdAt: board.createdAt.toISOString(),
          updatedAt: board.updatedAt.toISOString(),
        })) || [],
      metadata: {
        version: payload.metadata.version,
        lastSyncAt: payload.metadata.lastSyncAt.toISOString(),
        entriesCount: Number(
          (payload.entries?.length || 0) +
            (payload.passwordEntries?.length || 0)
        ),
        boardsCount: Number(payload.boards?.length || 0),
        checksum: payload.metadata.checksum,
        syncId: payload.metadata.syncId,
      },
    };
  }

  /**
   * Helper: Convert API response back to VaultPayload
   */
  convertApiResponseToVaultPayload(apiPayload: any): VaultPayload {
    return {
      entries:
        apiPayload.entries?.map((entry: any) => ({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          status: entry.status,
          priority: entry.priority,
          tags: entry.tags,
          assignedTo: entry.assignedTo,
          dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
          metadata: entry.metadata,
        })) || [],
      passwordEntries:
        apiPayload.passwordEntries?.map((entry: any) => ({
          id: entry.id,
          site: entry.site,
          username: entry.username,
          password: entry.password,
          hint: entry.hint,
          url: entry.url,
          notes: entry.notes,
          tags: entry.tags,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
          lastUsed: entry.lastUsed ? new Date(entry.lastUsed) : undefined,
          metadata: entry.metadata,
        })) || [],
      boards:
        apiPayload.boards?.map((board: any) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          columns: board.columns,
          settings: board.settings,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt),
        })) || [],
      metadata: {
        version: apiPayload.metadata.version,
        lastSyncAt: new Date(apiPayload.metadata.lastSyncAt),
        entriesCount: apiPayload.metadata.entriesCount,
        boardsCount: apiPayload.metadata.boardsCount,
        checksum: apiPayload.metadata.checksum,
        syncId: apiPayload.metadata.syncId,
      },
    };
  }
}

// Export singleton instance
export const vaultPayloadService = new VaultPayloadService();
export default vaultPayloadService;
