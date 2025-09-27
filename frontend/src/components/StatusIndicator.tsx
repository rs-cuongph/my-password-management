import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Check } from 'lucide-react';

export type StatusType =
  | 'idle'
  | 'saving'
  | 'syncing'
  | 'success'
  | 'error'
  | 'warning';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  showIcon?: boolean;
  showMessage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'detailed' | 'badge';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  showIcon = true,
  showMessage = true,
  className = '',
  size = 'md',
  variant = 'detailed',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="status-spin" />,
          color: 'text-primary-600 dark:text-primary-400',
          bgColor: 'bg-primary-50 dark:bg-primary-950',
          borderColor: 'border-primary-200 dark:border-primary-800',
          defaultMessage: 'Đang lưu...',
        };
      case 'syncing':
        return {
          icon: <Loader2 className="status-spin" />,
          color: 'text-secondary-600 dark:text-secondary-400',
          bgColor: 'bg-secondary-50 dark:bg-secondary-950',
          borderColor: 'border-secondary-200 dark:border-secondary-800',
          defaultMessage: 'Đang đồng bộ...',
        };
      case 'success':
        return {
          icon: <CheckCircle />,
          color: 'text-success-600 dark:text-success-400',
          bgColor: 'bg-success-50 dark:bg-success-950',
          borderColor: 'border-success-200 dark:border-success-800',
          defaultMessage: 'Đã lưu thành công',
        };
      case 'error':
        return {
          icon: <XCircle />,
          color: 'text-error-600 dark:text-error-400',
          bgColor: 'bg-error-50 dark:bg-error-950',
          borderColor: 'border-error-200 dark:border-error-800',
          defaultMessage: 'Lỗi lưu dữ liệu',
        };
      case 'warning':
        return {
          icon: <AlertTriangle />,
          color: 'text-warning-600 dark:text-warning-400',
          bgColor: 'bg-warning-50 dark:bg-warning-950',
          borderColor: 'border-warning-200 dark:border-warning-800',
          defaultMessage: 'Cảnh báo',
        };
      case 'idle':
      default:
        return {
          icon: <Check />,
          color: 'text-neutral-500 dark:text-neutral-400',
          bgColor: 'bg-neutral-50 dark:bg-neutral-900',
          borderColor: 'border-neutral-200 dark:border-neutral-700',
          defaultMessage: 'Sẵn sàng',
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-3 h-3',
          text: 'text-xs',
          padding: 'px-2 py-1',
        };
      case 'lg':
        return {
          icon: 'w-6 h-6',
          text: 'text-base',
          padding: 'px-4 py-3',
        };
      case 'md':
      default:
        return {
          icon: 'w-4 h-4',
          text: 'text-sm',
          padding: 'px-3 py-2',
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const displayMessage = message || config.defaultMessage;

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && (
          <div className={`${sizeClasses.icon} ${config.color}`}>
            {config.icon}
          </div>
        )}
        {showMessage && (
          <span className={`${sizeClasses.text} ${config.color} font-medium`}>
            {displayMessage}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`
        inline-flex items-center gap-2 ${sizeClasses.padding} rounded-full border
        ${config.bgColor} ${config.borderColor} ${config.color}
        ${className}
      `}
      >
        {showIcon && <div className={sizeClasses.icon}>{config.icon}</div>}
        {showMessage && (
          <span className={`${sizeClasses.text} font-medium`}>
            {displayMessage}
          </span>
        )}
      </div>
    );
  }

  // Default 'detailed' variant
  return (
    <div
      className={`
      flex items-center gap-3 ${sizeClasses.padding} rounded-xl border
      ${config.bgColor} ${config.borderColor}
      transition-all duration-200
      ${className}
    `}
    >
      {showIcon && (
        <div className={`${sizeClasses.icon} ${config.color} flex-shrink-0`}>
          {config.icon}
        </div>
      )}
      {showMessage && (
        <span className={`${sizeClasses.text} ${config.color} font-medium`}>
          {displayMessage}
        </span>
      )}
    </div>
  );
};

// Specialized components for common use cases
export const SaveStatus: React.FC<{
  isSaving: boolean;
  lastSaved?: Date;
  error?: string;
  className?: string;
}> = ({ isSaving, lastSaved, error, className }) => {
  if (error) {
    return (
      <StatusIndicator
        status="error"
        message={error}
        variant="badge"
        size="sm"
        className={className}
      />
    );
  }

  if (isSaving) {
    return (
      <StatusIndicator
        status="saving"
        variant="badge"
        size="sm"
        className={className}
      />
    );
  }

  if (lastSaved) {
    const timeAgo = formatTimeAgo(lastSaved);
    return (
      <StatusIndicator
        status="success"
        message={`Đã lưu ${timeAgo}`}
        variant="minimal"
        size="sm"
        className={className}
      />
    );
  }

  return null;
};

export const SyncStatus: React.FC<{
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  className?: string;
}> = ({ status, message, className }) => {
  return (
    <StatusIndicator
      status={status}
      message={message}
      variant="badge"
      size="sm"
      className={className}
    />
  );
};

export const ConnectionStatus: React.FC<{
  isOnline: boolean;
  className?: string;
}> = ({ isOnline, className }) => {
  return (
    <StatusIndicator
      status={isOnline ? 'success' : 'error'}
      message={isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
      variant="badge"
      size="sm"
      className={className}
    />
  );
};

// Utility function for time formatting
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}

export default StatusIndicator;
