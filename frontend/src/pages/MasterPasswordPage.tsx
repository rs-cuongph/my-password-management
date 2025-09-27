import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';
import { useAuthStore } from '../stores/authStore';
import { deriveMasterKey } from '../utils/crypto';
import { KDFProgressIndicator } from '../components/KDFProgressIndicator';
import { useI18n } from '../hooks/useI18n';

// Utility function to get kdfSalt from user profile
const getKdfSalt = (user: any): string | null => {
  // Only get salt from user profile (from server)
  return user?.kdfSalt || null;
};

const MasterPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { setMasterKey, setKDFParams, setIsUnlocked } =
    useMasterPasswordStore();
  const { user, token } = useAuthStore();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [kdfProgress, setKdfProgress] = useState(0);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Auto-focus password input on mount
  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!token || !user) {
      navigate({ to: '/login' });
      return;
    }

    // Check if kdfSalt exists in any available source
    const kdfSalt = getKdfSalt(user);
    if (!kdfSalt) {
      setError('Không tìm thấy salt từ server. Vui lòng đăng nhập lại.');
    }
  }, [navigate, token, user]);

  // Auto-lock functionality
  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-lock after 5 minutes of inactivity
      timeoutRef.current = setTimeout(
        () => {
          setIsUnlocked(false);
          setPassword('');
          navigate({ to: '/master-password' });
        },
        5 * 60 * 1000
      );
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Listen for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimeout();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigate, setIsUnlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError(t('masterPassword.errors.required'));
      return;
    }

    // Get kdfSalt from multiple sources with fallback priority
    const kdfSalt = getKdfSalt(user);

    if (!kdfSalt) {
      // Check if user is authenticated
      if (!token || !user) {
        setError(t('masterPassword.errors.notLoggedIn'));
        return;
      }

      setError(t('masterPassword.errors.saltNotFound'));
      return;
    }

    // Validate kdfSalt format (should be hex string)
    if (!/^[0-9a-fA-F]+$/.test(kdfSalt)) {
      setError(t('masterPassword.errors.invalidSalt'));
      return;
    }

    setIsLoading(true);
    setError('');
    setKdfProgress(0);

    try {
      // Derive master key with progress callback
      const { masterKey, kdfParams } = await deriveMasterKey(
        password,
        kdfSalt,
        (progress) => setKdfProgress(progress)
      );

      // Store master key and KDF parameters in correct order
      setKDFParams(kdfParams);
      setMasterKey(masterKey);

      // Initialize and unlock the store
      const { initialize, updateActivity } = useMasterPasswordStore.getState();
      initialize();
      setIsUnlocked(true);
      updateActivity();

      // Clear password from memory
      setPassword('');

      // Navigate to home page with a small delay to ensure all state updates are applied
      setTimeout(() => {
        // Double-check that we're properly unlocked before navigating
        const {
          isUnlocked,
          isInitialized,
          masterKey: storedKey,
        } = useMasterPasswordStore.getState();
        console.log('Pre-navigation state:', {
          isUnlocked,
          isInitialized,
          hasKey: !!storedKey,
        });

        if (isUnlocked && isInitialized && storedKey) {
          navigate({ to: '/' });
        } else {
          console.error('State not properly set after unlock:', {
            isUnlocked,
            isInitialized,
            hasKey: !!storedKey,
          });
          setError(t('masterPassword.errors.unlockFailed'));
        }
      }, 150);
    } catch (err) {
      console.error('Master key derivation failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : t('masterPassword.errors.derivationFailed')
      );
    } finally {
      setIsLoading(false);
      setKdfProgress(0);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('masterPassword.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('masterPassword.description')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="master-password" className="sr-only">
                Master Password
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="master-password"
                  name="master-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-12 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('masterPassword.placeholder')}
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                    {error.includes('salt') && (
                      <div className="mt-2">
                        <p className="text-sm text-red-700">
                          Để khắc phục lỗi này:
                        </p>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                          <li>Đảm bảo bạn đã đăng nhập thành công</li>
                          <li>
                            Không làm mới trang trước khi nhập master password
                          </li>
                          <li>
                            Hệ thống đã thử tìm salt từ: sessionStorage → user
                            profile → localStorage
                          </li>
                          <li>Thử đăng nhập lại nếu vấn đề vẫn tiếp tục</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="space-y-3">
                <KDFProgressIndicator progress={kdfProgress} />
                <div className="text-center text-sm text-gray-600">
                  {t('masterPassword.progress.deriving')}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
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
                  {t('masterPassword.processing')}
                </div>
              ) : (
                t('masterPassword.unlock')
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              disabled={isLoading}
            >
              {t('masterPassword.backToLogin')}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>{t('masterPassword.features.encrypted')}</p>
            <p>{t('masterPassword.features.autoLock')}</p>
            <p>{t('masterPassword.features.noServer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordPage;
