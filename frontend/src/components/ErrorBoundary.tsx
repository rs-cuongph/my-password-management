import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void
  ) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, only catch errors from direct children
  level?: 'page' | 'component' | 'critical'; // Different error levels
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorId: Math.random().toString(36).substr(2, 9),
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Here you could integrate with error tracking services like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    // For now, just log to console
    console.error('Error Report:', errorReport);
  };

  retry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.retry
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.retry}
          level={this.props.level || 'component'}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  retry: () => void;
  level: 'page' | 'component' | 'critical';
  errorId?: string;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  retry,
  level,
  errorId,
}) => {
  const getErrorConfig = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Lỗi nghiêm trọng',
          message:
            'Ứng dụng đã gặp lỗi nghiêm trọng và cần được khởi động lại.',
          icon: '🚨',
          color: 'error',
          showDetails: true,
          showRetry: false,
          showReload: true,
        };
      case 'page':
        return {
          title: 'Không thể tải trang',
          message: 'Đã xảy ra lỗi khi tải trang này. Vui lòng thử lại.',
          icon: '😞',
          color: 'error',
          showDetails: false,
          showRetry: true,
          showReload: true,
        };
      case 'component':
      default:
        return {
          title: 'Có lỗi xảy ra',
          message: 'Một phần của ứng dụng đã gặp lỗi. Vui lòng thử lại.',
          icon: '⚠️',
          color: 'warning',
          showDetails: false,
          showRetry: true,
          showReload: false,
        };
    }
  };

  const config = getErrorConfig();
  const [showDetails, setShowDetails] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  const copyErrorToClipboard = async () => {
    const errorText = `
Error ID: ${errorId}
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const getColorClasses = () => {
    switch (config.color) {
      case 'error':
        return {
          bg: 'bg-error-50 dark:bg-error-950',
          border: 'border-error-200 dark:border-error-800',
          text: 'text-error-800 dark:text-error-200',
          button: 'bg-error-600 hover:bg-error-700 text-white',
        };
      case 'warning':
      default:
        return {
          bg: 'bg-warning-50 dark:bg-warning-950',
          border: 'border-warning-200 dark:border-warning-800',
          text: 'text-warning-800 dark:text-warning-200',
          button: 'bg-warning-600 hover:bg-warning-700 text-white',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`
      max-w-2xl mx-auto p-6 border rounded-2xl ${colors.bg} ${colors.border}
      ${level === 'page' ? 'min-h-[400px] flex flex-col justify-center' : ''}
    `}
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${colors.text}`}>
          {config.title}
        </h2>
        <p className={`${colors.text} opacity-90`}>{config.message}</p>
        {errorId && (
          <p className="text-sm text-neutral-500 mt-2">Mã lỗi: {errorId}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {config.showRetry && (
          <button
            onClick={retry}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${colors.button}`}
          >
            Thử lại
          </button>
        )}
        {config.showReload && (
          <button
            onClick={handleReload}
            className="px-6 py-3 rounded-xl font-medium transition-all bg-neutral-600 hover:bg-neutral-700 text-white"
          >
            Tải lại trang
          </button>
        )}
        {config.showDetails && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-3 rounded-xl font-medium transition-all bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
          >
            {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
              Chi tiết lỗi
            </h3>
            <button
              onClick={copyErrorToClipboard}
              className={`
                px-3 py-1 text-sm rounded-lg transition-all
                ${
                  isCopied
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }
              `}
            >
              {isCopied ? 'Đã sao chép!' : 'Sao chép lỗi'}
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <strong className="block text-neutral-800 dark:text-neutral-200 mb-1">
                Thông báo lỗi:
              </strong>
              <code className="block p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-800 dark:text-neutral-200 break-all">
                {error.message}
              </code>
            </div>

            {error.stack && (
              <div>
                <strong className="block text-neutral-800 dark:text-neutral-200 mb-1">
                  Stack trace:
                </strong>
                <code className="block p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                  {error.stack}
                </code>
              </div>
            )}

            {errorInfo.componentStack && (
              <div>
                <strong className="block text-neutral-800 dark:text-neutral-200 mb-1">
                  Component stack:
                </strong>
                <code className="block p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                  {errorInfo.componentStack}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, onError }) => {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, onError }) => {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

export const CriticalErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, onError }) => {
  return (
    <ErrorBoundary level="critical" onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    level?: 'page' | 'component' | 'critical';
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    fallback?: (
      error: Error,
      errorInfo: ErrorInfo,
      retry: () => void
    ) => ReactNode;
  }
) => {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        level={options?.level || 'component'}
        onError={options?.onError}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;
