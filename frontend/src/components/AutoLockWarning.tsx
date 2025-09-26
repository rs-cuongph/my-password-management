import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useMasterPasswordStore, getMasterPasswordStatus } from '../stores/masterPasswordStore';

interface AutoLockWarningProps {
  warningThresholds?: number[]; // Time in seconds before lock to show warnings
  enabled?: boolean;
}

export const AutoLockWarning: React.FC<AutoLockWarningProps> = ({
  warningThresholds = [300, 60, 30, 10], // 5 min, 1 min, 30 sec, 10 sec
  enabled = true
}) => {
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);
  const { addToast, removeToast } = useToast();
  const { extendSession } = useMasterPasswordStore();

  const checkWarnings = useCallback(() => {
    if (!enabled) return;

    const status = getMasterPasswordStatus();
    if (!status.isUnlocked || !status.autoLockEnabled) return;

    const timeUntilLockSeconds = Math.floor(status.timeUntilLock / 1000);
    
    // Find the appropriate warning threshold
    const threshold = warningThresholds.find(t => timeUntilLockSeconds <= t && timeUntilLockSeconds > lastWarningTime);
    
    if (threshold && timeUntilLockSeconds <= threshold) {
      setLastWarningTime(timeUntilLockSeconds);
      showWarning(timeUntilLockSeconds);
    }

    // Reset warning tracker if time increased (session was extended)
    if (timeUntilLockSeconds > lastWarningTime + 10) {
      setLastWarningTime(0);
    }
  }, [enabled, warningThresholds, lastWarningTime, addToast]);

  const showWarning = (timeLeft: number) => {
    const formatTime = (seconds: number) => {
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes} phút ${remainingSeconds} giây` : `${minutes} phút`;
      }
      return `${seconds} giây`;
    };

    const handleExtendSession = async () => {
      setIsExtending(true);
      try {
        await extendSession();
        addToast({
          message: 'Phiên làm việc đã được gia hạn',
          type: 'success',
          duration: 3000
        });
      } catch (error) {
        addToast({
          message: 'Không thể gia hạn phiên làm việc',
          type: 'error',
          duration: 5000
        });
      } finally {
        setIsExtending(false);
      }
    };

    const getWarningType = (seconds: number) => {
      if (seconds <= 10) return 'error';
      if (seconds <= 30) return 'warning';
      return 'info';
    };

    const getWarningMessage = (seconds: number) => {
      if (seconds <= 10) {
        return `⚠️ Vault sẽ tự khóa sau ${formatTime(seconds)}!`;
      }
      if (seconds <= 30) {
        return `🔒 Vault sẽ tự khóa sau ${formatTime(seconds)}`;
      }
      if (seconds <= 60) {
        return `⏰ Vault sẽ tự khóa sau ${formatTime(seconds)}`;
      }
      return `📢 Vault sẽ tự khóa sau ${formatTime(seconds)}`;
    };

    addToast({
      message: getWarningMessage(timeLeft),
      type: getWarningType(timeLeft),
      duration: timeLeft <= 30 ? 0 : 8000, // Persistent for urgent warnings
      persistent: timeLeft <= 30,
      showProgress: timeLeft > 30,
      action: {
        label: isExtending ? 'Đang gia hạn...' : 'Gia hạn phiên',
        onClick: handleExtendSession
      }
    });
  };

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(checkWarnings, 1000);
    return () => clearInterval(interval);
  }, [checkWarnings, enabled]);

  return null; // This component doesn't render anything visible
};

// Hook for using auto-lock warnings
export const useAutoLockWarning = (options?: {
  warningThresholds?: number[];
  enabled?: boolean;
  onWarning?: (timeLeft: number) => void;
  onLockImminent?: () => void;
}) => {
  const { warningThresholds = [300, 60, 30, 10], enabled = true, onWarning, onLockImminent } = options || {};
  const [timeUntilLock, setTimeUntilLock] = useState<number>(0);
  const [lastWarning, setLastWarning] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const checkStatus = () => {
      const status = getMasterPasswordStatus();
      if (!status.isUnlocked || !status.autoLockEnabled) return;

      const timeLeftSeconds = Math.floor(status.timeUntilLock / 1000);
      setTimeUntilLock(timeLeftSeconds);

      // Check for warnings
      const threshold = warningThresholds.find(t => timeLeftSeconds <= t && timeLeftSeconds > lastWarning);
      if (threshold && timeLeftSeconds <= threshold) {
        setLastWarning(timeLeftSeconds);
        onWarning?.(timeLeftSeconds);

        // Special handling for imminent lock
        if (timeLeftSeconds <= 10) {
          onLockImminent?.();
        }
      }

      // Reset if session extended
      if (timeLeftSeconds > lastWarning + 10) {
        setLastWarning(0);
      }
    };

    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [enabled, warningThresholds, lastWarning, onWarning, onLockImminent]);

  return {
    timeUntilLock,
    isWarningActive: warningThresholds.some(t => timeUntilLock <= t),
    isUrgent: timeUntilLock <= 30,
    isCritical: timeUntilLock <= 10
  };
};

// Component for displaying warning in the UI
export const AutoLockWarningBanner: React.FC<{
  showWhen?: number; // Show banner when time left is less than this (in seconds)
  className?: string;
}> = ({ showWhen = 60, className = '' }) => {
  const { timeUntilLock, isWarningActive, isUrgent, isCritical } = useAutoLockWarning({
    warningThresholds: [showWhen]
  });
  const [isExtending, setIsExtending] = useState(false);
  const { extendSession } = useMasterPasswordStore();
  const { addToast } = useToast();

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await extendSession();
      addToast({
        message: 'Phiên làm việc đã được gia hạn',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      addToast({
        message: 'Không thể gia hạn phiên làm việc',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsExtending(false);
    }
  };

  if (!isWarningActive || timeUntilLock > showWhen) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}:00`;
    }
    return `${seconds}`;
  };

  const getBannerStyle = () => {
    if (isCritical) {
      return 'bg-error-50 dark:bg-error-950 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200';
    }
    if (isUrgent) {
      return 'bg-warning-50 dark:bg-warning-950 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200';
    }
    return 'bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200';
  };

  return (
    <div className={`
      border rounded-xl p-4 mb-4 transition-all duration-300
      ${getBannerStyle()}
      ${isCritical ? 'animate-pulse' : ''}
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${isCritical ? 'animate-bounce' : isUrgent ? 'animate-pulse' : ''}`}>
            {isCritical ? '🚨' : isUrgent ? '⚠️' : '⏰'}
          </div>
          <div>
            <p className="font-medium">
              {isCritical ? 'Vault sắp tự khóa!' : 'Thông báo tự khóa'}
            </p>
            <p className="text-sm opacity-90">
              Vault sẽ tự khóa sau {formatTime(timeUntilLock)} {timeUntilLock >= 60 ? '' : 'giây'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExtend}
          disabled={isExtending}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${isCritical 
              ? 'bg-error-600 hover:bg-error-700 text-white' 
              : isUrgent
                ? 'bg-warning-600 hover:bg-warning-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isExtending ? 'Đang gia hạn...' : 'Gia hạn phiên'}
        </button>
      </div>
    </div>
  );
};

export default AutoLockWarning;