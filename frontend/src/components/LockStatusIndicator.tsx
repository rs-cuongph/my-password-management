import { useState, useEffect } from 'react';
import {
  useMasterPasswordStore,
  getMasterPasswordStatus,
} from '../stores/masterPasswordStore';

interface LockStatusIndicatorProps {
  showTimeRemaining?: boolean;
  showLockButton?: boolean;
  className?: string;
  onManualLock?: () => void;
}

export const LockStatusIndicator = ({
  showTimeRemaining = true,
  showLockButton = true,
  className = '',
  onManualLock,
}: LockStatusIndicatorProps) => {
  const [status, setStatus] = useState(getMasterPasswordStatus);
  const { lock } = useMasterPasswordStore();

  // Update status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMasterPasswordStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!status.isUnlocked) return 'text-red-600';
    if (status.timeUntilLock < 60000) return 'text-orange-600'; // Less than 1 minute
    if (status.timeUntilLock < 300000) return 'text-yellow-600'; // Less than 5 minutes
    return 'text-green-600';
  };

  // Handle manual lock
  const handleLock = () => {
    lock('manual');
    onManualLock?.();
  };

  if (!status.isInitialized) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Lock Status Icon */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${status.isUnlocked ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {status.isUnlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      {/* Time Remaining */}
      {showTimeRemaining && status.isUnlocked && (
        <div className="flex items-center space-x-1">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className={`text-sm ${getStatusColor()}`}>
            {formatTimeRemaining(status.timeUntilLock)}
          </span>
        </div>
      )}

      {/* Manual Lock Button */}
      {showLockButton && status.isUnlocked && (
        <button
          onClick={handleLock}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Lock Vault manually"
        >
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Lock</span>
        </button>
      )}

      {/* Lock Reason (when locked) */}
      {!status.isUnlocked && status.lockReason && (
        <div className="text-xs text-gray-500">
          {status.lockReason === 'timeout' && '(Auto-locked due to inactivity)'}
          {status.lockReason === 'focus_lost' &&
            '(Auto-locked due to tab switch)'}
          {status.lockReason === 'manual' && '(Manually locked)'}
        </div>
      )}
    </div>
  );
};

// Compact version for smaller spaces
export const CompactLockIndicator = ({
  onManualLock,
}: {
  onManualLock?: () => void;
}) => {
  const [status, setStatus] = useState(getMasterPasswordStatus);
  const { lock } = useMasterPasswordStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMasterPasswordStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLock = () => {
    lock('manual');
    onManualLock?.();
  };

  if (!status.isInitialized) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status.isUnlocked ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={status.isUnlocked ? 'Vault is unlocked' : 'Vault is locked'}
      />
      {status.isUnlocked && (
        <button
          onClick={handleLock}
          className="p-1 text-gray-500 hover:text-gray-700 rounded"
          title="Lock Vault"
        >
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
