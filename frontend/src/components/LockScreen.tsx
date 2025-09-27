import { useState, useEffect } from 'react';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';
import { deriveMasterKey } from '../utils/crypto';

interface LockScreenProps {
  onUnlock?: () => void;
  reason?: 'manual' | 'timeout' | 'focus_lost';
}

export const LockScreen = ({
  onUnlock,
  reason = 'manual',
}: LockScreenProps) => {
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { kdfParams, unlock, updateActivity } = useMasterPasswordStore();

  const reasonMessages = {
    manual: 'Vault đã bị khóa',
    timeout: 'Vault đã tự động khóa do không hoạt động',
    focus_lost: 'Vault đã tự động khóa khi mất focus',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !kdfParams) return;

    setIsUnlocking(true);
    setError('');

    try {
      // Derive the master key from password
      const result = await deriveMasterKey(password, kdfParams.salt);
      const masterKey = result.masterKey;

      // Unlock the vault
      unlock(masterKey, kdfParams);
      updateActivity();

      // Clear form
      setPassword('');

      // Notify parent
      onUnlock?.();
    } catch (err) {
      console.error('Unlock failed:', err);
      setError('Mật khẩu không đúng');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Auto-focus password input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('unlock-password');
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Clear error when password changes
  useEffect(() => {
    if (error && password) {
      setError('');
    }
  }, [password, error]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600"
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
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vault đã bị khóa
          </h2>
          <p className="text-gray-600">{reasonMessages[reason]}</p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unlock-password" className="sr-only">
              Master Password
            </label>
            <div className="relative">
              <input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập master password để mở khóa"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUnlocking}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                tabIndex={-1}
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m0 0l3.122 3.122M9.878 9.878L6.758 6.758M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim() || isUnlocking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUnlocking ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang mở khóa...
              </span>
            ) : (
              'Mở khóa Vault'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Vault sẽ tự động khóa sau khi không hoạt động để bảo vệ dữ liệu của
            bạn
          </p>
        </div>
      </div>
    </div>
  );
};
