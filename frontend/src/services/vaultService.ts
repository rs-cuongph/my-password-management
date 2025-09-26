import { api } from './api';
import { VaultCryptoService, VaultPayload, PasswordEntry, EncryptedVaultPayload } from '../utils/vaultCrypto';
import { KDFParams } from '../utils/crypto';

export interface VaultSyncStatus {
  status: 'saved' | 'saving' | 'error' | 'conflict' | 'syncing';
  lastSyncAt?: Date;
  serverVersion?: number;
  localVersion: number;
  hasUnsavedChanges: boolean;
  error?: string;
}

export interface ServerVaultData {
  encryptedPayload: EncryptedVaultPayload;
  wrappedDEK: any;
  version: number;
  lastModified: Date;
  checksum: string;
}

export interface VaultConflict {
  serverData: ServerVaultData;
  localData: VaultPayload;
  conflictType: 'version_mismatch' | 'checksum_mismatch';
}

export interface VaultLoadResult {
  vault?: VaultPayload;
  error?: string;
  requiresAuthentication?: boolean;
}

export interface VaultSaveResult {
  success: boolean;
  version?: number;
  error?: string;
  conflict?: VaultConflict;
}

class VaultService {
  private readonly baseUrl = '/api/v1/vault';
  private currentVault: VaultPayload | null = null;
  private syncStatus: VaultSyncStatus = {
    status: 'saved',
    localVersion: 0,
    hasUnsavedChanges: false,
  };
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_DELAY = 5000; // 5 seconds debounce

  /**
   * Load vault from server and decrypt
   */
  async loadVault(masterPassword: string, kdfParams: KDFParams): Promise<VaultLoadResult> {
    try {
      this.setSyncStatus({ status: 'syncing' });

      const response = await api.get(`${this.baseUrl}/data`);

      if (response.status === 204) {
        // No vault exists yet, create empty one
        const emptyVault = VaultCryptoService.createEmptyVault();
        this.currentVault = emptyVault;
        this.setSyncStatus({
          status: 'saved',
          localVersion: 1,
          hasUnsavedChanges: false,
          lastSyncAt: new Date(),
        });
        return { vault: emptyVault };
      }

      const serverData: ServerVaultData = response.data;

      // Decrypt vault
      const decryptResult = await VaultCryptoService.decryptVaultWithPassword(
        serverData.encryptedPayload,
        serverData.wrappedDEK,
        masterPassword,
        kdfParams
      );

      this.currentVault = decryptResult.payload;
      this.setSyncStatus({
        status: 'saved',
        localVersion: serverData.version,
        serverVersion: serverData.version,
        hasUnsavedChanges: false,
        lastSyncAt: new Date(),
      });

      return { vault: decryptResult.payload };
    } catch (error: any) {
      this.setSyncStatus({
        status: 'error',
        error: error.message || 'Failed to load vault'
      });

      if (error.status === 401) {
        return { requiresAuthentication: true };
      }

      return { error: error.message || 'Failed to load vault' };
    }
  }

  /**
   * Save vault to server (manual save)
   */
  async saveVault(masterPassword: string, kdfParams: KDFParams, force = false): Promise<VaultSaveResult> {
    if (!this.currentVault) {
      return { success: false, error: 'No vault to save' };
    }

    try {
      this.setSyncStatus({ status: 'saving' });

      // Encrypt vault
      const encryptResult = await VaultCryptoService.encryptVaultWithPassword(
        this.currentVault,
        masterPassword,
        kdfParams
      );

      // Save to server
      const response = await api.post(`${this.baseUrl}/save`, {
        encryptedPayload: encryptResult.encryptedPayload,
        wrappedDEK: encryptResult.wrappedDEK,
        version: this.syncStatus.localVersion,
        force,
      });

      const result = response.data;

      if (result.conflict && !force) {
        this.setSyncStatus({
          status: 'conflict',
          serverVersion: result.serverVersion,
        });

        return {
          success: false,
          conflict: {
            serverData: result.serverData,
            localData: this.currentVault,
            conflictType: 'version_mismatch',
          },
        };
      }

      this.setSyncStatus({
        status: 'saved',
        localVersion: result.version,
        serverVersion: result.version,
        hasUnsavedChanges: false,
        lastSyncAt: new Date(),
      });

      return { success: true, version: result.version };
    } catch (error: any) {
      this.setSyncStatus({
        status: 'error',
        error: error.message || 'Failed to save vault'
      });

      return { success: false, error: error.message || 'Failed to save vault' };
    }
  }

  /**
   * Update vault with optimistic updates and auto-save
   */
  updateVault(updates: Partial<VaultPayload>): void {
    if (!this.currentVault) return;

    // Store backup for rollback
    const backup = { ...this.currentVault };

    try {
      // Apply optimistic update
      this.currentVault = {
        ...this.currentVault,
        ...updates,
        metadata: {
          ...this.currentVault.metadata,
          ...updates.metadata,
          lastSyncAt: new Date(),
        },
      };

      this.setSyncStatus({
        hasUnsavedChanges: true,
        localVersion: this.syncStatus.localVersion + 1,
      });

      // Schedule auto-save
      this.scheduleAutoSave();

    } catch (error) {
      // Rollback on error
      this.currentVault = backup;
      this.setSyncStatus({
        status: 'error',
        error: 'Failed to update vault'
      });
    }
  }

  /**
   * Add password entry to vault
   */
  addPasswordEntry(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): string {
    if (!this.currentVault) throw new Error('No vault loaded');

    const updatedVault = VaultCryptoService.addPasswordEntry(this.currentVault, entry);
    this.currentVault = updatedVault;

    this.setSyncStatus({
      hasUnsavedChanges: true,
      localVersion: this.syncStatus.localVersion + 1,
    });

    // Schedule auto-save
    this.scheduleAutoSave();

    // Return the ID of the new entry
    const newEntry = updatedVault.passwordEntries?.[updatedVault.passwordEntries.length - 1];
    return newEntry?.id || '';
  }

  /**
   * Update password entry in vault
   */
  updatePasswordEntry(entryId: string, updates: Partial<PasswordEntry>): void {
    if (!this.currentVault) throw new Error('No vault loaded');

    const updatedVault = VaultCryptoService.updatePasswordEntry(this.currentVault, entryId, updates);
    this.currentVault = updatedVault;

    this.setSyncStatus({
      hasUnsavedChanges: true,
      localVersion: this.syncStatus.localVersion + 1,
    });

    // Schedule auto-save
    this.scheduleAutoSave();
  }

  /**
   * Remove password entry from vault
   */
  removePasswordEntry(entryId: string): void {
    if (!this.currentVault) throw new Error('No vault loaded');

    const updatedVault = VaultCryptoService.removePasswordEntry(this.currentVault, entryId);
    this.currentVault = updatedVault;

    this.setSyncStatus({
      hasUnsavedChanges: true,
      localVersion: this.syncStatus.localVersion + 1,
    });

    // Schedule auto-save
    this.scheduleAutoSave();
  }

  /**
   * Schedule auto-save with debounce
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.autoSave();
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Auto-save vault
   */
  private async autoSave(): Promise<void> {
    if (!this.syncStatus.hasUnsavedChanges) return;

    // Get credentials from store (implement this based on your auth system)
    const credentials = this.getStoredCredentials();
    if (!credentials) return;

    const result = await this.saveVault(credentials.masterPassword, credentials.kdfParams);

    if (!result.success && result.conflict) {
      // Handle conflicts in auto-save by deferring to manual resolution
      this.setSyncStatus({ status: 'conflict' });
    }
  }

  /**
   * Resolve conflict by choosing server or local version
   */
  async resolveConflict(
    choice: 'server' | 'local',
    masterPassword: string,
    kdfParams: KDFParams,
    conflict: VaultConflict
  ): Promise<VaultSaveResult> {
    if (choice === 'server') {
      // Accept server version
      const decryptResult = await VaultCryptoService.decryptVaultWithPassword(
        conflict.serverData.encryptedPayload,
        conflict.serverData.wrappedDEK,
        masterPassword,
        kdfParams
      );

      this.currentVault = decryptResult.payload;
      this.setSyncStatus({
        status: 'saved',
        localVersion: conflict.serverData.version,
        serverVersion: conflict.serverData.version,
        hasUnsavedChanges: false,
        lastSyncAt: new Date(),
      });

      return { success: true, version: conflict.serverData.version };
    } else {
      // Force save local version
      return this.saveVault(masterPassword, kdfParams, true);
    }
  }

  /**
   * Get current vault
   */
  getVault(): VaultPayload | null {
    return this.currentVault;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): VaultSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: VaultSyncStatus) => void): () => void {
    // Simple event system - in real app, use proper event emitter
    const handler = (event: CustomEvent<VaultSyncStatus>) => {
      callback(event.detail);
    };

    window.addEventListener('vault-sync-status-change', handler as EventListener);

    return () => {
      window.removeEventListener('vault-sync-status-change', handler as EventListener);
    };
  }

  /**
   * Clear vault from memory
   */
  clearVault(): void {
    this.currentVault = null;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.setSyncStatus({
      status: 'saved',
      localVersion: 0,
      hasUnsavedChanges: false,
    });
  }

  /**
   * Update sync status and emit event
   */
  private setSyncStatus(updates: Partial<VaultSyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };

    // Emit status change event
    window.dispatchEvent(
      new CustomEvent('vault-sync-status-change', { detail: this.syncStatus })
    );
  }

  /**
   * Get stored credentials (implement based on your auth system)
   */
  private getStoredCredentials(): { masterPassword: string; kdfParams: KDFParams } | null {
    // This should integrate with your master password store
    // For now, return null to disable auto-save when credentials not available
    return null;
  }
}

// Export singleton instance
export const vaultService = new VaultService();
export default vaultService;