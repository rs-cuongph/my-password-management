import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import VaultDashboard from '../components/VaultDashboard';
import EntryForm from '../components/EntryForm';
import { ThemeToggle } from '../components/ThemeToggle';
import VaultSyncStatusIndicator from '../components/VaultSyncStatus';
import VaultConflictResolver from '../components/VaultConflictResolver';
import type { PasswordEntry } from '../utils/vaultCrypto';
import { useVault } from '../hooks/useVault';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';
import { useAuthStore } from '../stores/authStore';

export const VaultPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | undefined>();
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const { masterPassword, kdfParams } = useMasterPasswordStore();
  const { user, token, isAuthenticated } = useAuthStore();

  // Use vault hook for all vault operations
  const {
    vault,
    entries,
    isLoadingVault,
    syncStatus,
    error,
    conflict,
    loadVault,
    saveVault,
    addEntry,
    updateEntry,
    removeEntry,
    resolveConflict,
    clearError,
  } = useVault();

  // Load vault data on mount
  useEffect(() => {
    if (masterPassword && kdfParams && isAuthenticated) {
      loadVault();
    }
  }, [masterPassword, kdfParams, isAuthenticated, loadVault]);

  const handleAddEntry = () => {
    // Check if vault is loaded
    if (!vault) {
      console.error('Cannot add entry: Vault not loaded');
      return;
    }

    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleSaveEntry = async (
    entryData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      console.log('handleSaveEntry called with:', entryData);

      // Check if vault is loaded
      if (!vault) {
        console.error('Cannot save entry: Vault not loaded');
        return;
      }

      if (editingEntry) {
        // Update existing entry
        console.log('Updating existing entry:', editingEntry.id);
        updateEntry(editingEntry.id, entryData);
      } else {
        // Add new entry
        console.log('Adding new entry');
        const entryId = addEntry(entryData);
        console.log('New entry ID:', entryId);
      }

      setIsFormOpen(false);
      setEditingEntry(undefined);
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      return;
    }

    try {
      removeEntry(entryId);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const handleCopyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);

      // Show success notification (you might want to use a toast library)
      const notification = document.createElement('div');
      notification.textContent = 'Mật khẩu đã được sao chép!';
      notification.className =
        'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleSaveVault = async () => {
    await saveVault();
  };

  const handleResolveConflict = async (choice: 'server' | 'local') => {
    setIsResolvingConflict(true);
    try {
      await resolveConflict(choice);
    } finally {
      setIsResolvingConflict(false);
    }
  };

  // Show loading if not authenticated yet
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center animate-pulse-soft">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Đang xác thực...
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingVault) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center animate-pulse-soft">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Đang tải vault...
          </p>
          <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
            Giải mã dữ liệu bảo mật
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !masterPassword) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="card p-8 shadow-xl animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-error-100 to-warning-100 dark:from-error-900 dark:to-warning-900 rounded-2xl flex items-center justify-center">
              <svg
                className="w-10 h-10 text-error-600 dark:text-error-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Cần xác thực
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {error}
            </p>
            <Link
              to="/master-password"
              className="btn-primary text-base py-3 flex items-center gap-3 w-full justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Nhập Master Password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
              >
                My Password Management
              </Link>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Password Vault
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/settings" className="nav-link flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Cài đặt</span>
              </Link>

              <ThemeToggle variant="dropdown" size="md" />

              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-sm text-neutral-600 dark:text-neutral-400">
                  {user?.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sync Status Bar */}
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="container mx-auto max-w-6xl">
          <VaultSyncStatusIndicator
            status={syncStatus}
            onSave={handleSaveVault}
            className="justify-between"
          />
        </div>
      </div>

      {/* Error notification */}
      {error && masterPassword && (
        <div className="card border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950 p-4 mx-4 mt-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-error-700 dark:text-error-300 flex-1">
              {error}
            </p>
            <button
              onClick={clearError}
              className="text-error-400 hover:text-error-600 dark:hover:text-error-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <VaultDashboard
        entries={entries}
        onAddEntry={handleAddEntry}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        onCopyPassword={handleCopyPassword}
        isVaultLoaded={!!vault}
      />

      {/* Entry Form Modal */}
      <EntryForm
        entry={editingEntry}
        onSave={handleSaveEntry}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />

      {/* Conflict Resolution Modal */}
      {conflict && (
        <VaultConflictResolver
          conflict={conflict}
          onResolve={handleResolveConflict}
          isResolving={isResolvingConflict}
        />
      )}
    </div>
  );
};

export default VaultPage;
