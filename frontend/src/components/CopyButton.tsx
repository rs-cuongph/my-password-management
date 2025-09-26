import React, { useState, useCallback } from 'react';
import { copyToClipboard, cancelClipboardAutoClear } from '../utils/clipboard';
import { useToast } from '../contexts/ToastContext';

interface CopyButtonProps {
  text: string;
  type?: string;
  clearTimeout?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  showCountdown?: boolean;
  children?: React.ReactNode;
  title?: string;
  onCopySuccess?: (text: string, type: string) => void;
  onCopyError?: (error: string) => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  type = 'text',
  clearTimeout = 15,
  className = '',
  size = 'md',
  variant = 'ghost',
  showCountdown = true,
  children,
  title,
  onCopySuccess,
  onCopyError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [toastId, setToastId] = useState<string | null>(null);
  const { addToast, updateToast, removeToast } = useToast();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1';
      case 'lg':
        return 'p-3';
      case 'md':
      default:
        return 'p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      case 'md':
      default:
        return 'w-4 h-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300';
      case 'solid':
        return 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white';
      case 'ghost':
      default:
        return 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800';
    }
  };

  const handleCopy = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await copyToClipboard(text, type, {
        clearTimeout,
        showCountdown,
        onCountdown: showCountdown ? (remaining) => {
          setCountdown(remaining);
          if (toastId) {
            updateToast(toastId, {
              countdown: remaining,
              showCountdown: true,
              message: `${type} đã được sao chép vào clipboard${clearTimeout > 0 ? ` (tự xóa sau ${remaining}s)` : ''}`
            });
          }
        } : undefined
      });

      if (result.success) {
        // Show success toast
        const newToastId = addToast({
          message: result.message,
          type: 'success',
          duration: clearTimeout > 0 ? (clearTimeout + 1) * 1000 : 3000,
          countdown: clearTimeout,
          showCountdown: showCountdown && clearTimeout > 0,
          showProgress: clearTimeout > 0 && showCountdown
        });
        setToastId(newToastId);

        // Set initial countdown
        if (showCountdown && clearTimeout > 0) {
          setCountdown(clearTimeout);
        }

        onCopySuccess?.(text, type);
      } else {
        // Show error toast
        addToast({
          message: result.message,
          type: 'error',
          duration: 5000
        });
        onCopyError?.(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = `Lỗi sao chép ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      addToast({
        message: errorMessage,
        type: 'error',
        duration: 5000
      });
      onCopyError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [text, type, clearTimeout, showCountdown, isLoading, toastId, addToast, updateToast, onCopySuccess, onCopyError]);

  const handleCancelAutoClear = useCallback(() => {
    cancelClipboardAutoClear(type);
    setCountdown(null);
    if (toastId) {
      removeToast(toastId);
      setToastId(null);
    }
    addToast({
      message: `Đã hủy tự xóa ${type}`,
      type: 'info',
      duration: 2000
    });
  }, [type, toastId, removeToast, addToast]);

  const buttonTitle = title || `Sao chép ${type}`;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopy}
        disabled={isLoading}
        className={`
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${className}
          rounded transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
        `}
        title={buttonTitle}
      >
        {children || (
          <>
            {isLoading ? (
              <svg className={`${getIconSize()} animate-spin`} fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </>
        )}
      </button>

      {countdown !== null && countdown > 0 && showCountdown && (
        <button
          onClick={handleCancelAutoClear}
          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 px-1 py-0.5 rounded transition-colors"
          title="Hủy tự xóa"
        >
          {countdown}s
        </button>
      )}
    </div>
  );
};

export default CopyButton;