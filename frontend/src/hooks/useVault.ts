import { useState, useEffect, useCallback } from 'react';
import { vaultService, VaultSyncStatus, VaultConflict } from '../services/vaultService';
import { VaultPayload, PasswordEntry } from '../utils/vaultCrypto';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

export interface UseVaultReturn {
  // Vault data
  vault: VaultPayload | null;
  entries: PasswordEntry[];

  // Loading states
  isLoading: boolean;
  isLoadingVault: boolean;
  isSaving: boolean;

  // Sync status
  syncStatus: VaultSyncStatus;
  hasUnsavedChanges: boolean;

  // Error handling
  error: string | null;
  conflict: VaultConflict | null;

  // Actions
  loadVault: () => Promise<void>;
  saveVault: (force?: boolean) => Promise<void>;
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntry: (entryId: string, updates: Partial<PasswordEntry>) => void;
  removeEntry: (entryId: string) => void;
  resolveConflict: (choice: 'server' | 'local') => Promise<void>;
  clearError: () => void;
  clearVault: () => void;
}

export const useVault = (): UseVaultReturn => {
  const [vault, setVault] = useState<VaultPayload | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<VaultSyncStatus>(vaultService.getSyncStatus());
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<VaultConflict | null>(null);

  const { masterPassword, kdfParams } = useMasterPasswordStore();

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = vaultService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      setIsSaving(status.status === 'saving');

      if (status.error) {
        setError(status.error);
      }
    });

    return unsubscribe;
  }, []);

  // Update vault when service vault changes
  useEffect(() => {
    const currentVault = vaultService.getVault();
    setVault(currentVault);
  }, [syncStatus.localVersion]);

  const loadVault = useCallback(async () => {
    if (!masterPassword || !kdfParams) {
      setError('Master password and KDF params required');
      return;
    }

    setIsLoadingVault(true);
    setError(null);

    try {
      const result = await vaultService.loadVault(masterPassword, kdfParams);

      if (result.vault) {
        setVault(result.vault);
      } else if (result.error) {
        setError(result.error);
      } else if (result.requiresAuthentication) {
        setError('Authentication required');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vault');
    } finally {
      setIsLoadingVault(false);
    }
  }, [masterPassword, kdfParams]);

  const saveVault = useCallback(async (force = false) => {
    if (!masterPassword || !kdfParams) {
      setError('Master password and KDF params required');
      return;
    }

    setError(null);
    setConflict(null);

    try {
      const result = await vaultService.saveVault(masterPassword, kdfParams, force);

      if (!result.success) {
        if (result.conflict) {
          setConflict(result.conflict);
        } else if (result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save vault');
    }
  }, [masterPassword, kdfParams]);

  const addEntry = useCallback((entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const entryId = vaultService.addPasswordEntry(entry);
      setError(null);
      return entryId;
    } catch (err: any) {
      setError(err.message || 'Failed to add entry');
      return '';
    }
  }, []);

  const updateEntry = useCallback((entryId: string, updates: Partial<PasswordEntry>) => {
    try {
      vaultService.updatePasswordEntry(entryId, updates);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    }
  }, []);

  const removeEntry = useCallback((entryId: string) => {
    try {
      vaultService.removePasswordEntry(entryId);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove entry');
    }
  }, []);

  const resolveConflict = useCallback(async (choice: 'server' | 'local') => {
    if (!conflict || !masterPassword || !kdfParams) return;

    setError(null);

    try {
      const result = await vaultService.resolveConflict(choice, masterPassword, kdfParams, conflict);

      if (result.success) {
        setConflict(null);
        setVault(vaultService.getVault());
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve conflict');
    }
  }, [conflict, masterPassword, kdfParams]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearVault = useCallback(() => {
    vaultService.clearVault();
    setVault(null);
    setError(null);
    setConflict(null);
  }, []);

  return {
    // Vault data
    vault,
    entries: vault?.passwordEntries || [],

    // Loading states
    isLoading: isLoadingVault || isSaving,
    isLoadingVault,
    isSaving,

    // Sync status
    syncStatus,
    hasUnsavedChanges: syncStatus.hasUnsavedChanges,

    // Error handling
    error,
    conflict,

    // Actions
    loadVault,
    saveVault,
    addEntry,
    updateEntry,
    removeEntry,
    resolveConflict,
    clearError,
    clearVault,
  };
};