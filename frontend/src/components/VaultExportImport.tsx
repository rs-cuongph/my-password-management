import React, { useState, useRef } from 'react';
import { useVault } from '../hooks/useVault';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

interface VaultExportImportProps {
  className?: string;
}

export const VaultExportImport: React.FC<VaultExportImportProps> = ({
  className,
}) => {
  const { vault, entries } = useVault();
  const { isUnlocked } = useMasterPasswordStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportVault = async () => {
    try {
      setIsExporting(true);

      if (!vault) {
        throw new Error('Không có dữ liệu vault để xuất');
      }

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        vault: vault,
        entries_count: entries.length,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi xảy ra khi xuất vault: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportVault = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(false);

      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.vault || !importData.version) {
        throw new Error('File không đúng định dạng vault');
      }

      // Here you would typically call a vault service to import the data
      // For now, we'll just show success message
      console.log('Import data:', importData);

      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setImportError((error as Error).message);
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Export Section */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Xuất dữ liệu Vault
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Tạo bản sao lưu của vault đã mã hóa
            </p>
          </div>
          <button
            onClick={handleExportVault}
            disabled={!isUnlocked || isExporting || !vault}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isExporting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Đang xuất...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Xuất Vault
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Nhập dữ liệu Vault
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Khôi phục vault từ file sao lưu
            </p>
          </div>
          <button
            onClick={handleImportVault}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary-600 hover:bg-secondary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isImporting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Đang nhập...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Nhập Vault
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Status Messages */}
        {importError && (
          <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-danger-600 dark:text-danger-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-danger-600 dark:text-danger-400">
                {importError}
              </span>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="mt-3 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-success-600 dark:text-success-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-success-600 dark:text-success-400">
                Nhập vault thành công!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="card p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-warning-700 dark:text-warning-300">
              Lưu ý quan trọng
            </h4>
            <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
              • Dữ liệu xuất ra vẫn được mã hóa, cần master password để mở
              <br />
              • Nhập vault sẽ thay thế toàn bộ dữ liệu hiện tại
              <br />• Nên tạo bản sao lưu trước khi nhập dữ liệu mới
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
