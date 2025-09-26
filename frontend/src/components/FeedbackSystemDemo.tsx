import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { StatusIndicator, SaveStatus, SyncStatus, ConnectionStatus } from './StatusIndicator';
import { AutoLockWarning, AutoLockWarningBanner, useAutoLockWarning } from './AutoLockWarning';
import { 
  SkeletonLoader, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonList,
  VaultLoadingSkeleton,
  AuthLoadingSkeleton,
  LoadingScreen 
} from './SkeletonLoader';
import { ErrorBoundary, ComponentErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import FeedbackIntegrationExample from './FeedbackIntegrationExample';

export const FeedbackSystemDemo: React.FC = () => {
  const { addToast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToastExamples = () => {
    const examples = [
      { message: 'Đây là thông báo thành công!', type: 'success' as const, showProgress: true },
      { message: 'Cảnh báo: Hãy kiểm tra thông tin', type: 'warning' as const, showProgress: true },
      { message: 'Thông tin quan trọng', type: 'info' as const, showProgress: false },
      { message: 'Có lỗi xảy ra!', type: 'error' as const, persistent: true }
    ];

    examples.forEach((example, index) => {
      setTimeout(() => {
        addToast({
          ...example,
          duration: example.persistent ? 0 : 5000,
          action: example.type === 'error' ? {
            label: 'Thử lại',
            onClick: () => console.log('Retry action')
          } : undefined
        });
      }, index * 1000);
    });
  };

  const simulateSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure
      if (Math.random() > 0.3) {
        setSaveStatus('success');
        setLastSaved(new Date());
        addToast({
          message: 'Dữ liệu đã được lưu thành công',
          type: 'success',
          duration: 3000,
          showProgress: true
        });
      } else {
        throw new Error('Không thể kết nối đến server');
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Lỗi không xác định');
      addToast({
        message: 'Lỗi lưu dữ liệu: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'),
        type: 'error',
        duration: 5000,
        action: {
          label: 'Thử lại',
          onClick: simulateSave
        }
      });
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const simulateSync = async () => {
    setSyncStatus('syncing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setSyncStatus('success');
      addToast({
        message: 'Đồng bộ thành công',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const showLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const ErrorComponent: React.FC = () => {
    const [shouldError, setShouldError] = useState(false);

    if (shouldError) {
      throw new Error('This is a demo error for testing error boundaries!');
    }

    return (
      <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl">
        <h4 className="font-medium mb-2">Error Boundary Test</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Click the button below to trigger an error and see the error boundary in action.
        </p>
        <button
          onClick={() => setShouldError(true)}
          className="btn-danger"
        >
          Trigger Error
        </button>
      </div>
    );
  };

  const SafeErrorComponent = withErrorBoundary(ErrorComponent, {
    level: 'component'
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          🎯 Feedback System Demo
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Comprehensive demonstration of toast notifications, status indicators, loading states, and error handling
        </p>
      </div>

      {/* Auto-lock warning banner */}
      <AutoLockWarningBanner showWhen={300} />

      {/* Status indicators */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          📊 Status Indicators
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-medium mb-4">Save Status</h3>
            <div className="space-y-3">
              <SaveStatus 
                isSaving={saveStatus === 'saving'}
                lastSaved={lastSaved || undefined}
                error={saveError || undefined}
              />
              <button onClick={simulateSave} className="btn-primary w-full">
                {saveStatus === 'saving' ? 'Đang lưu...' : 'Simulate Save'}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-medium mb-4">Sync Status</h3>
            <div className="space-y-3">
              <SyncStatus status={syncStatus} />
              <button onClick={simulateSync} className="btn-secondary w-full">
                {syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Simulate Sync'}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-medium mb-4">Connection Status</h3>
            <div className="space-y-3">
              <ConnectionStatus isOnline={isOnline} />
              <button 
                onClick={() => setIsOnline(!isOnline)} 
                className="btn-ghost w-full"
              >
                Toggle Connection
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-medium mb-4">All Status Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatusIndicator status="saving" />
            <StatusIndicator status="syncing" />
            <StatusIndicator status="success" />
            <StatusIndicator status="error" />
            <StatusIndicator status="warning" />
            <StatusIndicator status="idle" />
          </div>
        </div>
      </section>

      {/* Toast notifications */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          🍞 Toast Notifications
        </h2>
        
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={showToastExamples} className="btn-primary">
              Show Toast Examples
            </button>
            <button 
              onClick={() => addToast({
                message: 'Copy notification with countdown',
                type: 'success',
                duration: 10000,
                showProgress: true,
                showCountdown: true,
                countdown: 10
              })}
              className="btn-secondary"
            >
              Copy Feedback Demo
            </button>
          </div>
        </div>
      </section>

      {/* Loading states */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          ⏳ Loading States
        </h2>
        
        <div className="card p-6">
          <div className="mb-4">
            <button onClick={showLoadingDemo} className="btn-primary">
              Show Loading Demo
            </button>
          </div>
          
          {isLoading ? (
            <LoadingScreen>
              <VaultLoadingSkeleton />
            </LoadingScreen>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Basic Skeletons</h4>
                <div className="space-y-3">
                  <SkeletonTitle />
                  <SkeletonText lines={3} />
                  <SkeletonButton />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Card Skeleton</h4>
                <SkeletonCard showHeader showFooter />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h4 className="font-medium mb-4">Auth Loading</h4>
            <AuthLoadingSkeleton />
          </div>
          
          <div className="card p-6">
            <h4 className="font-medium mb-4">List Loading</h4>
            <SkeletonList items={3} showAvatar />
          </div>
        </div>
      </section>

      {/* Error boundaries */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          🚨 Error Boundaries
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComponentErrorBoundary>
            <SafeErrorComponent />
          </ComponentErrorBoundary>
          
          <div className="card p-6">
            <h4 className="font-medium mb-2">Error Boundary Features</h4>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>✅ User-friendly error messages</li>
              <li>✅ Retry functionality</li>
              <li>✅ Error details for developers</li>
              <li>✅ Copy error information</li>
              <li>✅ Different error levels</li>
              <li>✅ Automatic error reporting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Auto-lock warnings */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          🔒 Auto-lock Warnings
        </h2>
        
        <div className="card p-6">
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              Auto-lock warnings are automatically shown when the vault is about to lock.
              The warnings appear at configurable thresholds (5 min, 1 min, 30 sec, 10 sec).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => addToast({
                  message: '📢 Vault sẽ tự khóa sau 5 phút',
                  type: 'info',
                  duration: 8000,
                  showProgress: true,
                  action: { label: 'Gia hạn phiên', onClick: () => console.log('Extend session') }
                })}
                className="btn-primary"
              >
                5 Min Warning
              </button>
              
              <button 
                onClick={() => addToast({
                  message: '⏰ Vault sẽ tự khóa sau 1 phút',
                  type: 'warning',
                  duration: 8000,
                  showProgress: true,
                  action: { label: 'Gia hạn phiên', onClick: () => console.log('Extend session') }
                })}
                className="btn-secondary"
              >
                1 Min Warning
              </button>
              
              <button 
                onClick={() => addToast({
                  message: '🚨 Vault sắp tự khóa sau 10 giây!',
                  type: 'error',
                  persistent: true,
                  action: { label: 'Gia hạn phiên', onClick: () => console.log('Extend session') }
                })}
                className="btn-danger"
              >
                Critical Warning
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Real-world integration example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          🔧 Real-world Integration Example
        </h2>
        
        <FeedbackIntegrationExample />
      </section>

      {/* Hidden components */}
      <AutoLockWarning enabled={true} />
    </div>
  );
};

export default FeedbackSystemDemo;