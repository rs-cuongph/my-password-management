import { useState } from 'react';
import { useAutoLock } from '../hooks/useAutoLock';
import { LockScreen } from './LockScreen';
import { LockStatusIndicator, CompactLockIndicator } from './LockStatusIndicator';
import { AutoLockSettings } from './AutoLockSettings';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

interface AutoLockDemoProps {
  className?: string;
}

export const AutoLockDemo = ({ className = '' }: AutoLockDemoProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockReason, setLockReason] = useState<'manual' | 'timeout' | 'focus_lost'>('manual');

  const { isUnlocked, isInitialized, sensitiveData, setSensitiveData, clearSensitiveData } = useMasterPasswordStore();

  // Use the auto-lock hook
  const { timeUntilLock, lockNow, isTabActive } = useAutoLock({
    onLock: () => {
      console.log('🔒 Vault locked');
      setShowLockScreen(true);
    },
    onUnlock: () => {
      console.log('🔓 Vault unlocked');
      setShowLockScreen(false);
    },
    onActivityDetected: () => {
      console.log('👆 User activity detected');
    },
  });

  // Demo functions
  const addSensitiveData = () => {
    const timestamp = new Date().toISOString();
    setSensitiveData('demoData', {
      secret: 'This is sensitive information',
      timestamp,
      randomValue: Math.random(),
    });
  };

  const removeSensitiveData = () => {
    clearSensitiveData('demoData');
  };

  const handleManualLock = () => {
    setLockReason('manual');
    lockNow();
  };

  const handleUnlock = () => {
    setShowLockScreen(false);
  };

  if (!isInitialized) {
    return (
      <div className={`bg-gray-50 rounded-lg border p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Auto-Lock Demo
          </h3>
          <p className="text-gray-600">
            Please initialize the vault first to test auto-lock functionality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Auto-Lock Demo
            </h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>

          {/* Status Overview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Current Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Vault Status:</span>
                <span className={`font-medium ${isUnlocked ? 'text-green-600' : 'text-red-600'}`}>
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tab Active:</span>
                <span className={`font-medium ${isTabActive ? 'text-green-600' : 'text-orange-600'}`}>
                  {isTabActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Until Lock:</span>
                <span className="font-medium text-gray-900">
                  {Math.ceil(timeUntilLock / 1000)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sensitive Data:</span>
                <span className={`font-medium ${sensitiveData?.demoData ? 'text-blue-600' : 'text-gray-400'}`}>
                  {sensitiveData?.demoData ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Lock Status Indicators */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Lock Status Indicators</h4>

            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Full Indicator:</p>
              <LockStatusIndicator onManualLock={handleManualLock} />
            </div>

            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Compact Indicator:</p>
              <CompactLockIndicator onManualLock={handleManualLock} />
            </div>
          </div>

          {/* Demo Actions */}
          {isUnlocked && (
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-900">Demo Actions</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={addSensitiveData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Sensitive Data
                </button>

                <button
                  onClick={removeSensitiveData}
                  disabled={!sensitiveData?.demoData}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear Sensitive Data
                </button>

                <button
                  onClick={handleManualLock}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Manual Lock
                </button>

                <button
                  onClick={() => window.open('https://example.com', '_blank')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Test Focus Loss
                </button>
              </div>
            </div>
          )}

          {/* Sensitive Data Display */}
          {sensitiveData?.demoData && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-red-900 mb-2">
                ⚠️ Sensitive Data (will be cleared on lock)
              </h4>
              <pre className="text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(sensitiveData.demoData, null, 2)}
              </pre>
            </div>
          )}

          {/* Auto-Lock Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              How to Test Auto-Lock
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Wait for the countdown timer to reach zero (inactivity lock)</li>
              <li>• Switch to another tab and come back (focus loss lock)</li>
              <li>• Click the "Manual Lock" button</li>
              <li>• Adjust the timeout in settings to test different intervals</li>
              <li>• Add sensitive data and watch it get cleared when locked</li>
            </ul>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 p-6">
            <AutoLockSettings showTitle={false} />
          </div>
        )}
      </div>

      {/* Lock Screen Overlay */}
      {showLockScreen && (
        <LockScreen
          reason={lockReason}
          onUnlock={handleUnlock}
        />
      )}
    </>
  );
};