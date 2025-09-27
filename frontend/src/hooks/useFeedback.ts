import { useCallback, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

// Hook for managing save states with feedback
export const useSaveState = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string>('');
  const { addToast } = useToast();

  const save = useCallback(
    async (
      saveFunction: () => Promise<void>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        showProgress?: boolean;
      }
    ) => {
      const {
        successMessage = 'Đã lưu thành công',
        errorMessage = 'Lỗi khi lưu dữ liệu',
        showProgress = true,
      } = options || {};

      setIsSaving(true);
      setSaveError('');

      try {
        await saveFunction();
        setLastSaved(new Date());
        addToast({
          message: successMessage,
          type: 'success',
          duration: 3000,
          showProgress,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setSaveError(errorMsg);
        addToast({
          message: `${errorMessage}: ${errorMsg}`,
          type: 'error',
          duration: 5000,
          action: {
            label: 'Thử lại',
            onClick: () => save(saveFunction, options),
          },
        });
      } finally {
        setIsSaving(false);
      }
    },
    [addToast]
  );

  const resetSaveState = useCallback(() => {
    setIsSaving(false);
    setSaveError('');
    setLastSaved(null);
  }, []);

  return {
    isSaving,
    lastSaved,
    saveError,
    save,
    resetSaveState,
  };
};

// Hook for managing async operations with loading and error states
export const useAsyncOperation = <T = any>() => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { addToast } = useToast();

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        showSuccessToast?: boolean;
        showErrorToast?: boolean;
      }
    ) => {
      const {
        successMessage = 'Thao tác thành công',
        errorMessage = 'Đã xảy ra lỗi',
        showSuccessToast = false,
        showErrorToast = true,
      } = options || {};

      setIsLoading(true);
      setError(null);

      try {
        const result = await operation();
        setData(result);

        if (showSuccessToast) {
          addToast({
            message: successMessage,
            type: 'success',
            duration: 3000,
          });
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(errorMessage);
        setError(error);

        if (showErrorToast) {
          addToast({
            message: `${errorMessage}: ${error.message}`,
            type: 'error',
            duration: 5000,
            action: {
              label: 'Thử lại',
              onClick: () => execute(operation, options),
            },
          });
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
  };
};

// Hook for network status feedback
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { addToast } = useToast();

  const updateOnlineStatus = useCallback(
    (online: boolean) => {
      setIsOnline(online);

      if (online) {
        addToast({
          message: '🌐 Đã kết nối lại internet',
          type: 'success',
          duration: 3000,
        });
      } else {
        addToast({
          message: '⚠️ Mất kết nối internet',
          type: 'warning',
          persistent: true,
        });
      }
    },
    [addToast]
  );

  return {
    isOnline,
    updateOnlineStatus,
  };
};

// Hook for copy feedback with enhanced features
export const useCopyFeedback = () => {
  const { addToast } = useToast();

  const copyWithFeedback = useCallback(
    async (
      text: string,
      options?: {
        type?: string;
        successMessage?: string;
        errorMessage?: string;
        showCountdown?: boolean;
        clearTimeout?: number;
      }
    ) => {
      const {
        type = 'text',
        successMessage = `${type} đã được sao chép`,
        errorMessage = `Lỗi sao chép ${type}`,
        showCountdown = true,
        clearTimeout = 15,
      } = options || {};

      try {
        await navigator.clipboard.writeText(text);

        addToast({
          message: successMessage,
          type: 'success',
          duration: clearTimeout > 0 ? (clearTimeout + 1) * 1000 : 3000,
          countdown: clearTimeout,
          showCountdown: showCountdown && clearTimeout > 0,
          showProgress: clearTimeout > 0 && showCountdown,
        });

        return { success: true };
      } catch (error) {
        addToast({
          message: `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
          duration: 5000,
        });

        return { success: false, error };
      }
    },
    [addToast]
  );

  return { copyWithFeedback };
};

// Hook for form validation feedback
export const useFormFeedback = () => {
  const { addToast } = useToast();

  const showValidationError = useCallback(
    (message: string) => {
      addToast({
        message: `❌ ${message}`,
        type: 'error',
        duration: 4000,
      });
    },
    [addToast]
  );

  const showValidationSuccess = useCallback(
    (message: string) => {
      addToast({
        message: `✅ ${message}`,
        type: 'success',
        duration: 3000,
      });
    },
    [addToast]
  );

  const showFieldError = useCallback(
    (field: string, error: string) => {
      addToast({
        message: `${field}: ${error}`,
        type: 'warning',
        duration: 4000,
      });
    },
    [addToast]
  );

  return {
    showValidationError,
    showValidationSuccess,
    showFieldError,
  };
};

// Hook for bulk operations feedback
export const useBulkOperationFeedback = () => {
  const { addToast } = useToast();

  const showBulkProgress = useCallback(
    (current: number, total: number, operation: string) => {
      const progress = Math.round((current / total) * 100);

      return addToast({
        message: `${operation}: ${current}/${total} (${progress}%)`,
        type: 'info',
        duration: 0, // Keep until manually removed
        showProgress: true,
        persistent: true,
      });
    },
    [addToast]
  );

  const showBulkComplete = useCallback(
    (total: number, successful: number, failed: number, operation: string) => {
      const message =
        failed > 0
          ? `${operation} hoàn thành: ${successful}/${total} thành công, ${failed} thất bại`
          : `${operation} hoàn thành: ${successful}/${total} thành công`;

      addToast({
        message,
        type: failed > 0 ? 'warning' : 'success',
        duration: 5000,
      });
    },
    [addToast]
  );

  return {
    showBulkProgress,
    showBulkComplete,
  };
};

export default {
  useSaveState,
  useAsyncOperation,
  useNetworkStatus,
  useCopyFeedback,
  useFormFeedback,
  useBulkOperationFeedback,
};
