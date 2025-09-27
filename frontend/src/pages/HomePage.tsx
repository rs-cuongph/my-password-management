import React, { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import {
  useMasterPasswordStore,
  getMasterPasswordStatus,
  startAutoLockTimer,
  stopAutoLockTimer,
  resetAutoLockTimer,
} from '../stores/masterPasswordStore';
import { Link } from '@tanstack/react-router';
import { ThemeToggle } from '../components/ThemeToggle';
import { useI18n } from '../hooks/useI18n';

const HomePage: React.FC = () => {
  const { language, setLanguage } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const { lock } = useMasterPasswordStore();
  const { t } = useI18n();

  // Auto-lock functionality
  useEffect(() => {
    startAutoLockTimer();

    // Listen for user activity to reset auto-lock timer
    const handleActivity = () => {
      resetAutoLockTimer();
    };

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

    // Listen for master password lock events
    const handleMasterPasswordLock = () => {
      lock();
    };

    window.addEventListener('master-password-locked', handleMasterPasswordLock);

    return () => {
      stopAutoLockTimer();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      window.removeEventListener(
        'master-password-locked',
        handleMasterPasswordLock
      );
    };
  }, [lock]);

  const masterPasswordStatus = getMasterPasswordStatus();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
              >
                My Password Management
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/vault"
                    className="nav-link flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
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
                    <span className="hidden sm:inline">
                      {t('home.navigation.passwordVault')}
                    </span>
                  </Link>

                  <Link
                    to="/settings"
                    className="nav-link flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      {t('home.navigation.settings')}
                    </span>
                  </Link>
                </>
              )}

              <ThemeToggle variant="dropdown" size="md" />

              {isAuthenticated && (
                <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-sm text-neutral-600 dark:text-neutral-400">
                    {user?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-primary-200 to-secondary-200 dark:from-primary-900 dark:to-secondary-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gradient-to-tr from-secondary-200 to-primary-200 dark:from-secondary-900 dark:to-primary-900 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
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

              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {t('home.title')}
                </span>
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                {t('home.description')}
              </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {/* Auth Status */}
              <div className="card p-6 animate-slide-up">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isAuthenticated
                        ? 'bg-success-100 dark:bg-success-900'
                        : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    {isAuthenticated ? (
                      <svg
                        className="w-6 h-6 text-success-600 dark:text-success-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-neutral-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t('home.status.loginStatus')}
                </h3>
                <p
                  className={`text-sm ${
                    isAuthenticated
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {isAuthenticated
                    ? t('home.status.loggedIn')
                    : t('home.status.notLoggedIn')}
                </p>
              </div>

              {/* Master Password Status */}
              {isAuthenticated && (
                <div
                  className="card p-6 animate-slide-up"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        masterPasswordStatus.isUnlocked
                          ? 'bg-primary-100 dark:bg-primary-900'
                          : 'bg-warning-100 dark:bg-warning-900'
                      }`}
                    >
                      {masterPasswordStatus.isUnlocked ? (
                        <svg
                          className="w-6 h-6 text-primary-600 dark:text-primary-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-warning-600 dark:text-warning-400"
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
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    {t('home.status.vaultStatus')}
                  </h3>
                  <p
                    className={`text-sm ${
                      masterPasswordStatus.isUnlocked
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-warning-600 dark:text-warning-400'
                    }`}
                  >
                    {masterPasswordStatus.isUnlocked
                      ? t('home.status.unlocked')
                      : t('home.status.locked')}
                  </p>
                  {masterPasswordStatus.isUnlocked && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {t('home.status.autoLockIn', {
                        minutes: Math.ceil(
                          masterPasswordStatus.timeUntilLock / 1000 / 60
                        ),
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Language Setting */}
              <div
                className="card p-6 animate-slide-up"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-secondary-600 dark:text-secondary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t('home.status.language')}
                </h3>
                <button
                  onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                  className="btn-secondary text-sm"
                >
                  {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              {isAuthenticated && masterPasswordStatus.isUnlocked ? (
                <Link
                  to="/vault"
                  className="btn-primary text-lg px-8 py-4 flex items-center gap-3 animate-scale-in"
                >
                  <svg
                    className="w-6 h-6"
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
                  {t('home.actions.openVault')}
                </Link>
              ) : isAuthenticated ? (
                <Link
                  to="/master-password"
                  className="btn-primary text-lg px-8 py-4 flex items-center gap-3 animate-scale-in"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  {t('home.actions.unlockVault')}
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/login"
                    className="btn-primary text-lg px-8 py-4 flex items-center gap-3 animate-scale-in"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    {t('home.actions.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="btn-secondary text-lg px-8 py-4 flex items-center gap-3 animate-scale-in"
                    style={{ animationDelay: '0.1s' }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    {t('home.actions.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: t('home.features.endToEndSecurity.title'),
                description: t('home.features.endToEndSecurity.description'),
                color: 'from-success-500 to-emerald-500',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                ),
                title: t('home.features.responsiveDesign.title'),
                description: t('home.features.responsiveDesign.description'),
                color: 'from-primary-500 to-cyan-500',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ),
                title: t('home.features.darkMode.title'),
                description: t('home.features.darkMode.description'),
                color: 'from-secondary-500 to-purple-500',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
                title: t('home.features.highPerformance.title'),
                description: t('home.features.highPerformance.description'),
                color: 'from-warning-500 to-orange-500',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
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
                ),
                title: t('home.features.autoLock.title'),
                description: t('home.features.autoLock.description'),
                color: 'from-error-500 to-red-500',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                ),
                title: t('home.features.clipboardSecurity.title'),
                description: t('home.features.clipboardSecurity.description'),
                color: 'from-indigo-500 to-blue-500',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="card p-8 text-center animate-slide-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-200`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
