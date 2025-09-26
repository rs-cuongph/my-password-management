import React from 'react';
import { VaultSyncStatus } from '../services/vaultService';

interface VaultSyncStatusProps {
  status: VaultSyncStatus;
  onSave?: () => void;
  className?: string;
}

export const VaultSyncStatusIndicator: React.FC<VaultSyncStatusProps> = ({
  status,
  onSave,
  className = '',
}) => {
  const getStatusInfo = () => {
    switch (status.status) {
      case 'saved':
        return {
          icon: '✓',
          text: 'Đã lưu',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        };
      case 'saving':
        return {
          icon: '⟳',
          text: 'Đang lưu...',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          spinning: true,
        };
      case 'syncing':
        return {
          icon: '⟳',
          text: 'Đang đồng bộ...',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          spinning: true,
        };
      case 'error':
        return {
          icon: '⚠',
          text: 'Lỗi lưu',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        };
      case 'conflict':
        return {
          icon: '⚡',
          text: 'Xung đột',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
        };
      default:
        return {
          icon: '?',
          text: 'Không rõ',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatLastSync = (date?: Date) => {
    if (!date) return null;

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'vừa xong';
    } else if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else {
      return date.toLocaleString('vi-VN');
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Indicator */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium
          ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}
        `}
      >
        <span
          className={`
            inline-block text-base leading-none
            ${statusInfo.spinning ? 'animate-spin' : ''}
          `}
        >
          {statusInfo.icon}
        </span>
        <span>{statusInfo.text}</span>
      </div>

      {/* Last Sync Time */}
      {status.lastSyncAt && status.status === 'saved' && (
        <span className="text-xs text-gray-500">
          Lần cuối: {formatLastSync(status.lastSyncAt)}
        </span>
      )}

      {/* Unsaved Changes Indicator */}
      {status.hasUnsavedChanges && status.status !== 'saving' && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-orange-600 font-medium">
            Có thay đổi chưa lưu
          </span>
        </div>
      )}

      {/* Manual Save Button */}
      {onSave && status.hasUnsavedChanges && status.status !== 'saving' && (
        <button
          onClick={onSave}
          disabled={status.status === 'saving'}
          className="
            px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
            text-white text-sm font-medium rounded-lg transition-colors
            flex items-center gap-1.5
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Lưu ngay
        </button>
      )}

      {/* Error Message */}
      {status.error && status.status === 'error' && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={status.error}>
          {status.error}
        </div>
      )}

      {/* Version Info (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 font-mono">
          v{status.localVersion}
          {status.serverVersion && status.localVersion !== status.serverVersion && (
            <span className="text-orange-500">
              /s{status.serverVersion}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VaultSyncStatusIndicator;