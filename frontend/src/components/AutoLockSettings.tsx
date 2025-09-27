import { useState, useEffect } from 'react';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

interface AutoLockSettingsProps {
  className?: string;
  showTitle?: boolean;
}

const PRESET_TIMEOUTS = [
  { label: 'Never', value: 0 },
  { label: '30 seconds', value: 30 * 1000 },
  { label: '1 minute', value: 60 * 1000 },
  { label: '2 minutes', value: 2 * 60 * 1000 },
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '10 minutes', value: 10 * 60 * 1000 },
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
];

export const AutoLockSettings = ({
  className = '',
  showTitle = true,
}: AutoLockSettingsProps) => {
  const { autoLockTimeout, setAutoLockTimeout } = useMasterPasswordStore();
  const [selectedTimeout, setSelectedTimeout] = useState(autoLockTimeout);
  const [customTimeout, setCustomTimeout] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Update local state when store changes
  useEffect(() => {
    setSelectedTimeout(autoLockTimeout);

    // Check if current timeout is a preset
    const isPreset = PRESET_TIMEOUTS.some(
      (preset) => preset.value === autoLockTimeout
    );
    setShowCustom(!isPreset && autoLockTimeout > 0);

    if (!isPreset && autoLockTimeout > 0) {
      setCustomTimeout(Math.floor(autoLockTimeout / 60000).toString());
    }
  }, [autoLockTimeout]);

  const handlePresetChange = (value: number) => {
    setSelectedTimeout(value);
    setAutoLockTimeout(value);
    setShowCustom(false);
    setCustomTimeout('');
  };

  const handleCustomTimeoutChange = (value: string) => {
    setCustomTimeout(value);
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const timeoutMs = minutes * 60 * 1000;
      setSelectedTimeout(timeoutMs);
      setAutoLockTimeout(timeoutMs);
    }
  };

  const formatTimeoutDisplay = (ms: number): string => {
    if (ms === 0) return 'Never';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Auto-Lock Settings
          </h3>
          <p className="text-sm text-gray-600">
            Configure when the vault should automatically lock due to inactivity
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Current Setting Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Current auto-lock timeout:
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {formatTimeoutDisplay(selectedTimeout)}
            </span>
          </div>
        </div>

        {/* Preset Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose a preset:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_TIMEOUTS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  selectedTimeout === preset.value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Timeout */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              id="custom-timeout"
              checked={showCustom}
              onChange={(e) => setShowCustom(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="custom-timeout"
              className="text-sm font-medium text-gray-700"
            >
              Custom timeout
            </label>
          </div>

          {showCustom && (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={customTimeout}
                onChange={(e) => handleCustomTimeoutChange(e.target.value)}
                placeholder="Enter minutes"
                min="1"
                max="1440"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
              <h4 className="text-sm font-medium text-yellow-800">
                Security Recommendation
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                For maximum security, use a shorter auto-lock timeout. The vault
                also automatically locks when you switch to another tab or
                window.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Additional auto-lock triggers:
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Tab loses focus (switch to another tab/window)
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Inactivity timeout
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Manual lock button
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
