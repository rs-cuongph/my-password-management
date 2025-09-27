import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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
            <Lock className="w-8 h-8 text-gray-600" />
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
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
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
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
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
