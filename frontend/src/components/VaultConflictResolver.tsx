import React, { useState } from 'react';
import type { VaultConflict } from '../services/vaultService';

interface VaultConflictResolverProps {
  conflict: VaultConflict;
  onResolve: (choice: 'server' | 'local') => Promise<void>;
  onCancel?: () => void;
  isResolving?: boolean;
}

export const VaultConflictResolver: React.FC<VaultConflictResolverProps> = ({
  conflict,
  onResolve,
  onCancel,
  isResolving = false,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<
    'server' | 'local' | null
  >(null);

  const handleResolve = async () => {
    if (!selectedChoice) return;
    await onResolve(selectedChoice);
  };

  const getConflictDescription = () => {
    switch (conflict.conflictType) {
      case 'version_mismatch':
        return 'Vault đã được cập nhật bởi thiết bị khác. Bạn cần chọn phiên bản nào để giữ lại.';
      case 'checksum_mismatch':
        return 'Dữ liệu vault không khớp với server. Có thể có lỗi đồng bộ.';
      default:
        return 'Có xung đột dữ liệu cần được giải quyết.';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDataSummary = (isLocal: boolean) => {
    if (isLocal) {
      const data = conflict.localData;
      return {
        entries: data.entries?.length || 0,
        boards: data.boards?.length || 0,
        lastModified: data.metadata?.lastSyncAt,
      };
    } else {
      const data = conflict.serverData;
      return {
        entries: 'N/A', // Server data structure might be different
        boards: 'N/A',
        lastModified: data.lastModified,
      };
    }
  };

  const localSummary = getDataSummary(true);
  // const serverSummary = getDataSummary(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              ⚡ Xung Đột Dữ Liệu Vault
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={isResolving}
              >
                <svg
                  className="w-6 h-6"
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
            )}
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Cần Quyết Định Ngay
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{getConflictDescription()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Chọn phiên bản để giữ lại:
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Local Version */}
              <div
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${
                    selectedChoice === 'local'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedChoice('local')}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    📱 Phiên Bản Cục Bộ (Thiết Bị Này)
                  </h4>
                  <input
                    type="radio"
                    checked={selectedChoice === 'local'}
                    onChange={() => setSelectedChoice('local')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entries:</span>
                    <span className="font-medium">{localSummary.entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boards:</span>
                    <span className="font-medium">{localSummary.boards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sửa đổi lần cuối:</span>
                    <span className="font-medium">
                      {localSummary.lastModified
                        ? formatDate(localSummary.lastModified)
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    ✓ Chứa các thay đổi mới nhất của bạn trên thiết bị này
                  </p>
                  <p className="text-xs text-red-600">
                    ⚠ Có thể ghi đè thay đổi từ thiết bị khác
                  </p>
                </div>
              </div>

              {/* Server Version */}
              <div
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${
                    selectedChoice === 'server'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedChoice('server')}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    ☁️ Phiên Bản Server (Từ Thiết Bị Khác)
                  </h4>
                  <input
                    type="radio"
                    checked={selectedChoice === 'server'}
                    onChange={() => setSelectedChoice('server')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">
                      {conflict.serverData.version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checksum:</span>
                    <span className="font-medium font-mono text-xs">
                      {conflict.serverData.checksum.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sửa đổi lần cuối:</span>
                    <span className="font-medium">
                      {formatDate(conflict.serverData.lastModified)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-green-600">
                    ✓ Đã được đồng bộ từ thiết bị khác
                  </p>
                  <p className="text-xs text-red-600">
                    ⚠ Sẽ mất các thay đổi cục bộ chưa đồng bộ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Gợi Ý Lựa Chọn
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Chọn Cục Bộ</strong> nếu: Bạn vừa thực hiện thay đổi
                quan trọng trên thiết bị này.
              </p>
              <p>
                <strong>Chọn Server</strong> nếu: Bạn tin rằng phiên bản trên
                server mới hơn và chính xác hơn.
              </p>
              <p>
                <strong>Lưu ý:</strong> Lựa chọn này không thể hoàn tác. Hãy
                chắc chắn trước khi quyết định.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResolve}
              disabled={!selectedChoice || isResolving}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium transition-colors
                flex items-center justify-center gap-2
                ${
                  selectedChoice && !isResolving
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isResolving ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
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
                  Đang giải quyết...
                </>
              ) : (
                <>
                  ✓ Áp Dụng Lựa Chọn
                  {selectedChoice && (
                    <span className="text-sm opacity-80">
                      ({selectedChoice === 'local' ? 'Cục bộ' : 'Server'})
                    </span>
                  )}
                </>
              )}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isResolving}
                className="
                  flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-700
                  rounded-lg font-medium hover:bg-gray-300 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Hủy
              </button>
            )}
          </div>

          {/* Technical Details (for debugging) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium">
                  Technical Details (Dev Mode)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(
                    {
                      conflictType: conflict.conflictType,
                      serverVersion: conflict.serverData.version,
                      serverChecksum: conflict.serverData.checksum,
                      localEntries: conflict.localData.entries?.length,
                      localBoards: conflict.localData.boards?.length,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultConflictResolver;
