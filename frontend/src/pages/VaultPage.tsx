import React, { useState, useEffect } from 'react';
import VaultDashboard from '../components/VaultDashboard';
import EntryForm from '../components/EntryForm';
import { PasswordEntry, VaultCryptoService, PasswordVaultPayload } from '../utils/vaultCrypto';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';
import { useAuthStore } from '../stores/authStore';

export const VaultPage: React.FC = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { masterPassword, kdfParams } = useMasterPasswordStore();
  const { user } = useAuthStore();

  // Load vault data on mount
  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have master password
      if (!masterPassword || !kdfParams) {
        setError('Cần nhập master password để truy cập vault');
        return;
      }

      // Try to load existing vault or create empty one
      // This is a placeholder - in real implementation, you would fetch from API
      const mockEntries: PasswordEntry[] = [
        {
          id: '1',
          site: 'Google',
          username: 'user@example.com',
          password: 'password123',
          hint: 'Mật khẩu email chính',
          url: 'https://accounts.google.com',
          notes: 'Tài khoản Google chính cho công việc',
          tags: ['work', 'email'],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-01'),
          lastUsed: new Date('2024-02-20'),
        },
        {
          id: '2',
          site: 'GitHub',
          username: 'developer123',
          password: 'gh_securetoken456',
          url: 'https://github.com',
          notes: 'Tài khoản GitHub để phát triển',
          tags: ['work', 'development'],
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          site: 'Facebook',
          username: 'myemail@example.com',
          password: 'fb_pass789',
          hint: 'Tên thú cưng + năm sinh',
          url: 'https://facebook.com',
          tags: ['personal', 'social'],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-25'),
          lastUsed: new Date('2024-02-18'),
        },
      ];

      setEntries(mockEntries);
    } catch (err) {
      console.error('Failed to load vault data:', err);
      setError('Không thể tải dữ liệu vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleSaveEntry = async (entryData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();

      if (editingEntry) {
        // Update existing entry
        const updatedEntry: PasswordEntry = {
          ...editingEntry,
          ...entryData,
          updatedAt: now,
        };

        setEntries(prev =>
          prev.map(entry =>
            entry.id === editingEntry.id ? updatedEntry : entry
          )
        );
      } else {
        // Add new entry
        const newEntry: PasswordEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        setEntries(prev => [...prev, newEntry]);
      }

      setIsFormOpen(false);
      setEditingEntry(undefined);

      // Here you would save to encrypted vault
      // await saveVaultData();
    } catch (err) {
      console.error('Failed to save entry:', err);
      setError('Không thể lưu mục');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      return;
    }

    try {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));

      // Here you would save to encrypted vault
      // await saveVaultData();
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Không thể xóa mục');
    }
  };

  const handleCopyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);

      // Show success notification (you might want to use a toast library)
      const notification = document.createElement('div');
      notification.textContent = 'Mật khẩu đã được sao chép!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
      setError('Không thể sao chép mật khẩu');
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingEntry(undefined);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải vault...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !masterPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cần xác thực</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/master-password'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Nhập Master Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error notification */}
      {error && masterPassword && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
      />

      {/* Entry Form Modal */}
      <EntryForm
        entry={editingEntry}
        onSave={handleSaveEntry}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />
    </div>
  );
};

export default VaultPage;