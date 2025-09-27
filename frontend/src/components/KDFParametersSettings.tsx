import React, { useState } from 'react';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

interface KDFParametersSettingsProps {
  className?: string;
}

interface KDFPresetParams {
  memory: number;
  time: number;
  parallelism: number;
}

const KDF_PRESETS = {
  fast: {
    memory: 64 * 1024, // 64MB
    time: 1,
    parallelism: 1,
    label: 'Nhanh (ít bảo mật)',
    description: 'Thích hợp cho thiết bị yếu',
  },
  balanced: {
    memory: 256 * 1024, // 256MB
    time: 3,
    parallelism: 4,
    label: 'Cân bằng (khuyến nghị)',
    description: 'Cân bằng giữa bảo mật và hiệu suất',
  },
  secure: {
    memory: 512 * 1024, // 512MB
    time: 5,
    parallelism: 8,
    label: 'Bảo mật cao',
    description: 'Bảo mật tối đa, cần thiết bị mạnh',
  },
};

export const KDFParametersSettings: React.FC<KDFParametersSettingsProps> = ({
  className,
}) => {
  const { kdfParams, setKDFParams } = useMasterPasswordStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customParams, setCustomParams] = useState<KDFPresetParams>({
    memory: kdfParams?.memory || 256 * 1024,
    time: kdfParams?.time || 3,
    parallelism: kdfParams?.parallelism || 4,
  });

  const getCurrentPreset = () => {
    if (!kdfParams) return 'balanced';

    for (const [key, preset] of Object.entries(KDF_PRESETS)) {
      if (
        preset.memory === kdfParams.memory &&
        preset.time === kdfParams.time &&
        preset.parallelism === kdfParams.parallelism
      ) {
        return key;
      }
    }
    return 'custom';
  };

  const currentPreset = getCurrentPreset();

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === 'custom') {
      setCustomMode(true);
      return;
    }

    const preset = KDF_PRESETS[presetKey as keyof typeof KDF_PRESETS];
    if (preset && kdfParams) {
      setKDFParams({
        ...kdfParams,
        memory: preset.memory,
        time: preset.time,
        parallelism: preset.parallelism,
      });
      setCustomMode(false);
    }
    setIsOpen(false);
  };

  const handleCustomParamChange = (
    key: keyof KDFPresetParams,
    value: number
  ) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }));
  };

  const applyCustomParams = () => {
    if (kdfParams) {
      setKDFParams({
        ...kdfParams,
        ...customParams,
      });
    }
    setCustomMode(false);
    setIsOpen(false);
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
      >
        <div>
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {currentPreset === 'custom'
              ? 'Tùy chỉnh'
              : KDF_PRESETS[currentPreset as keyof typeof KDF_PRESETS]?.label}
          </span>
          {kdfParams && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatMemory(kdfParams.memory)} • {kdfParams.time}x •{' '}
              {kdfParams.parallelism} threads
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg">
          <div className="py-1">
            {Object.entries(KDF_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                  key === currentPreset
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                <div className="text-sm font-medium">{preset.label}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {preset.description}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  {formatMemory(preset.memory)} • {preset.time}x •{' '}
                  {preset.parallelism} threads
                </div>
              </button>
            ))}

            <button
              onClick={() => handlePresetSelect('custom')}
              className={`w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                currentPreset === 'custom'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <div className="text-sm font-medium">Tùy chỉnh</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Thiết lập thông số tùy chỉnh
              </div>
            </button>
          </div>
        </div>
      )}

      {customMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Tùy chỉnh thông số KDF
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bộ nhớ (KB)
                </label>
                <input
                  type="number"
                  value={customParams.memory}
                  onChange={(e) =>
                    handleCustomParamChange('memory', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  min="1024"
                  max="2097152"
                  step="1024"
                />
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatMemory(customParams.memory * 1024)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Số lần lặp
                </label>
                <input
                  type="number"
                  value={customParams.time}
                  onChange={(e) =>
                    handleCustomParamChange('time', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Số luồng song song
                </label>
                <input
                  type="number"
                  value={customParams.parallelism}
                  onChange={(e) =>
                    handleCustomParamChange(
                      'parallelism',
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  min="1"
                  max="16"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCustomMode(false)}
                className="flex-1 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={applyCustomParams}
                className="flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
