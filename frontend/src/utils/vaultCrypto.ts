import type { KDFParams } from './crypto';
import { vaultPayloadService } from '../services/vaultPayloadService';

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
  metadata?: Record<string, any>;
}

// Password Manager Entry Interface
export interface PasswordEntry {
  id: string;
  site: string; // Website/service name
  username: string; // Username/email
  password: string; // Encrypted password
  hint?: string; // Password hint
  url?: string; // Website URL
  notes?: string; // Additional notes
  tags?: string[]; // Tags for organization
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date; // Last time password was used
  metadata?: Record<string, any>;
}

// Updated VaultPayload to include password entries
export interface PasswordVaultPayload {
  passwordEntries: PasswordEntry[];
  boards: VaultBoard[];
  metadata: VaultMetadata;
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
  entriesCount: number;
  boardsCount: number;
  checksum?: string;
  syncId?: string;
}

export interface VaultPayload {
  entries: VaultEntry[]; // Password entries
  passwordEntries?: PasswordEntry[]; // Password manager entries
  boards: VaultBoard[];
  metadata: VaultMetadata;
}

export interface EncryptedVaultPayload {
  encryptedData: string;
  nonce: string;
  tag: string;
  compressed: boolean;
  algorithm: 'xchacha20-poly1305';
  version: number;
  createdAt: Date;
}

export interface VaultEncryptionOptions {
  compress?: boolean;
  compressionLevel?: number;
  aad?: string;
  forceCompression?: boolean;
}

export interface VaultDecryptionOptions {
  aad?: string;
  maxPayloadSize?: number;
  strictValidation?: boolean;
}

export interface VaultEncryptionResult {
  encryptedPayload: EncryptedVaultPayload;
  wrappedDEK: any; // WrappedDEK from backend
  stats: VaultEncryptionStats;
}

export interface VaultDecryptionResult {
  payload: VaultPayload;
  compressionRatio?: number;
  decryptionTime: number;
  warnings?: string[];
}

export interface VaultEncryptionStats {
  originalSize: number;
  compressedSize?: number;
  encryptedSize: number;
  compressionRatio?: number;
  encryptionTime: number;
  compressed: boolean;
}

/**
 * Vault Crypto Service for client-side vault operations
 * Now uses VaultPayloadService for API calls
 */
export class VaultCryptoService {
  /**
   * Encrypt vault payload with password
   */
  static async encryptVaultWithPassword(
    payload: VaultPayload,
    password: string,
    kdfParams: KDFParams,
    options: VaultEncryptionOptions = {}
  ): Promise<VaultEncryptionResult> {
    try {
      // Convert salt to base64 if it's not already
      const salt = kdfParams.salt;

      // Use VaultPayloadService for API call
      const result = await vaultPayloadService.encryptVaultWithPassword({
        payload: vaultPayloadService.convertVaultPayloadToApiFormat(payload),
        password,
        salt,
        options: {
          compression: options.compress,
          integrity: true,
          kdfParams: {
            opsLimit: kdfParams.time, // Map time to opsLimit
            memLimit: kdfParams.memory, // Map memory to memLimit
            algorithm: 2, // Argon2id algorithm ID
          },
        },
      });

      return {
        encryptedPayload: this.deserializeEncryptedPayload(
          result.encryptedPayload
        ),
        wrappedDEK: result.wrappedDEK,
        stats: {
          originalSize: result.stats.originalSize,
          compressedSize: result.stats.compressionRatio
            ? Math.round(
                result.stats.originalSize * result.stats.compressionRatio
              )
            : undefined,
          encryptedSize: result.stats.encryptedSize,
          compressionRatio: result.stats.compressionRatio,
          encryptionTime: result.stats.encryptionTime,
          compressed: result.stats.compressed,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to encrypt vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt vault payload with password
   */
  static async decryptVaultWithPassword(
    encryptedPayload: EncryptedVaultPayload,
    wrappedDEK: any,
    password: string,
    kdfParams: KDFParams,
    options: VaultDecryptionOptions = {}
  ): Promise<VaultDecryptionResult> {
    try {
      // Convert salt to base64 if it's not already
      const salt = kdfParams.salt;

      // Use VaultPayloadService for API call
      const result = await vaultPayloadService.decryptVaultWithPassword({
        encryptedPayload: this.serializeEncryptedPayload(encryptedPayload),
        wrappedDEK:
          typeof wrappedDEK === 'string'
            ? wrappedDEK
            : JSON.stringify(wrappedDEK),
        password,
        salt,
        options: {
          verifyIntegrity: options.strictValidation,
          kdfParams: {
            opsLimit: kdfParams.time, // Map time to opsLimit
            memLimit: kdfParams.memory, // Map memory to memLimit
            algorithm: 2, // Argon2id algorithm ID
          },
        },
      });

      return {
        payload: vaultPayloadService.convertApiResponseToVaultPayload(
          result.payload
        ),
        compressionRatio: result.stats.compressionRatio,
        decryptionTime: result.stats.decryptionTime,
        warnings: result.stats.warnings,
      };
    } catch (error) {
      throw new Error(
        `Failed to decrypt vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get vault encryption statistics
   */
  static async getVaultStats(
    encryptedPayload: EncryptedVaultPayload
  ): Promise<VaultEncryptionStats> {
    try {
      // Use VaultPayloadService for API call
      const result = await vaultPayloadService.getVaultStats({
        encryptedPayload: this.serializeEncryptedPayload(encryptedPayload),
      });

      return {
        originalSize: result.stats.originalSize,
        compressedSize: result.stats.compressionRatio
          ? Math.round(
              result.stats.originalSize * result.stats.compressionRatio
            )
          : undefined,
        encryptedSize: result.stats.encryptedSize,
        compressionRatio: result.stats.compressionRatio,
        encryptionTime: result.stats.encryptionTime,
        compressed: result.stats.compressed,
      };
    } catch (error) {
      throw new Error(
        `Failed to get vault stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new empty vault
   */
  static createEmptyVault(): VaultPayload {
    const now = new Date();
    return {
      entries: [], // Password entries
      passwordEntries: [], // Password manager entries
      boards: [
        {
          id: crypto.randomUUID(),
          name: 'My Board',
          description: 'Default password vault',
          columns: ['Todo', 'In Progress', 'Done'],
          settings: {
            color: '#3b82f6',
            archived: false,
            starred: false,
          },
          createdAt: now,
          updatedAt: now,
        },
      ],
      metadata: {
        version: '1.0.0',
        lastSyncAt: now,
        entriesCount: 0,
        boardsCount: 1,
        syncId: crypto.randomUUID(),
      },
    };
  }

  /**
   * Add password entry to vault
   */
  static addPasswordEntry(
    vault: VaultPayload,
    entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): VaultPayload {
    const now = new Date();
    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...vault,
      passwordEntries: [...(vault.passwordEntries || []), newEntry],
      metadata: {
        ...vault.metadata,
        entriesCount:
          vault.entries.length + (vault.passwordEntries?.length || 0) + 1,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Update password entry in vault
   */
  static updatePasswordEntry(
    vault: VaultPayload,
    entryId: string,
    updates: Partial<PasswordEntry>
  ): VaultPayload {
    const now = new Date();
    const passwordEntries = (vault.passwordEntries || []).map((entry) =>
      entry.id === entryId ? { ...entry, ...updates, updatedAt: now } : entry
    );

    return {
      ...vault,
      passwordEntries,
      metadata: {
        ...vault.metadata,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Remove password entry from vault
   */
  static removePasswordEntry(
    vault: VaultPayload,
    entryId: string
  ): VaultPayload {
    const now = new Date();
    const passwordEntries = (vault.passwordEntries || []).filter(
      (entry) => entry.id !== entryId
    );

    return {
      ...vault,
      passwordEntries,
      metadata: {
        ...vault.metadata,
        entriesCount: vault.entries.length + passwordEntries.length,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Add password entry to vault
   */
  static addEntry(
    vault: VaultPayload,
    entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): VaultPayload {
    const now = new Date();
    const newEntry: VaultEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...vault,
      entries: [...vault.entries, newEntry],
      metadata: {
        ...vault.metadata,
        entriesCount: vault.entries.length + 1,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Update entry in vault
   */
  static updateEntry(
    vault: VaultPayload,
    entryId: string,
    updates: Partial<VaultEntry>
  ): VaultPayload {
    const now = new Date();
    const entries = vault.entries.map((entry) =>
      entry.id === entryId ? { ...entry, ...updates, updatedAt: now } : entry
    );

    return {
      ...vault,
      entries,
      metadata: {
        ...vault.metadata,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Remove entry from vault
   */
  static removeEntry(vault: VaultPayload, entryId: string): VaultPayload {
    const now = new Date();
    const entries = vault.entries.filter((entry) => entry.id !== entryId);

    return {
      ...vault,
      entries,
      metadata: {
        ...vault.metadata,
        entriesCount: entries.length,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Add board to vault
   */
  static addBoard(
    vault: VaultPayload,
    board: Omit<VaultBoard, 'id' | 'createdAt' | 'updatedAt'>
  ): VaultPayload {
    const now = new Date();
    const newBoard: VaultBoard = {
      ...board,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...vault,
      boards: [...vault.boards, newBoard],
      metadata: {
        ...vault.metadata,
        boardsCount: vault.boards.length + 1,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Update board in vault
   */
  static updateBoard(
    vault: VaultPayload,
    boardId: string,
    updates: Partial<VaultBoard>
  ): VaultPayload {
    const now = new Date();
    const boards = vault.boards.map((board) =>
      board.id === boardId ? { ...board, ...updates, updatedAt: now } : board
    );

    return {
      ...vault,
      boards,
      metadata: {
        ...vault.metadata,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Remove board from vault
   */
  static removeBoard(vault: VaultPayload, boardId: string): VaultPayload {
    const now = new Date();
    const boards = vault.boards.filter((board) => board.id !== boardId);

    return {
      ...vault,
      boards,
      metadata: {
        ...vault.metadata,
        boardsCount: boards.length,
        lastSyncAt: now,
      },
    };
  }

  /**
   * Validate vault payload structure
   */
  static validatePayload(payload: any): payload is VaultPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    if (!Array.isArray(payload.entries) || !Array.isArray(payload.boards)) {
      return false;
    }

    if (!payload.metadata || typeof payload.metadata !== 'object') {
      return false;
    }

    // Check metadata structure
    const { metadata } = payload;
    if (
      !metadata.version ||
      !metadata.lastSyncAt ||
      typeof metadata.entriesCount !== 'number' ||
      typeof metadata.boardsCount !== 'number'
    ) {
      return false;
    }

    // Validate password entries
    for (const entry of payload.entries) {
      if (!entry.id || !entry.title || !entry.status || !entry.priority) {
        return false;
      }

      if (!['todo', 'in-progress', 'done'].includes(entry.status)) {
        return false;
      }

      if (!['low', 'medium', 'high'].includes(entry.priority)) {
        return false;
      }
    }

    // Validate password entries (optional)
    if (payload.passwordEntries && Array.isArray(payload.passwordEntries)) {
      for (const entry of payload.passwordEntries) {
        if (!entry.id || !entry.site || !entry.username || !entry.password) {
          return false;
        }
      }
    }

    // Validate boards
    for (const board of payload.boards) {
      if (!board.id || !board.name || !Array.isArray(board.columns)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get vault summary statistics
   */
  static getVaultSummary(vault: VaultPayload): {
    totalPasswordEntries: number;
    totalBoards: number;
    entriesByStatus: Record<string, number>;
    entriesByPriority: Record<string, number>;
    lastUpdated: Date;
  } {
    const entriesByStatus = vault.entries.reduce(
      (acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const entriesByPriority = vault.entries.reduce(
      (acc, entry) => {
        acc[entry.priority] = (acc[entry.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate last updated across all entries
    let lastUpdated = vault.metadata.lastSyncAt;

    // Check password entries
    for (const entry of vault.entries) {
      if (entry.updatedAt > lastUpdated) {
        lastUpdated = entry.updatedAt;
      }
    }

    // Check password entries
    if (vault.passwordEntries) {
      for (const entry of vault.passwordEntries) {
        if (entry.updatedAt > lastUpdated) {
          lastUpdated = entry.updatedAt;
        }
      }
    }

    return {
      totalPasswordEntries: vault.entries.length,
      totalBoards: vault.boards.length,
      entriesByStatus,
      entriesByPriority,
      lastUpdated,
    };
  }

  // Private helper methods

  private static serializeEncryptedPayload(
    encryptedPayload: EncryptedVaultPayload
  ): any {
    return {
      ...encryptedPayload,
      createdAt: encryptedPayload.createdAt.toISOString(),
    };
  }

  private static deserializeEncryptedPayload(
    encryptedPayload: any
  ): EncryptedVaultPayload {
    return {
      ...encryptedPayload,
      createdAt: new Date(encryptedPayload.createdAt),
    };
  }
}
