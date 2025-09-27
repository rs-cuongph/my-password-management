import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import {
  AutoLockTimeoutSettings,
  ClipboardTimeoutSettings,
  FontSizeSettings,
  KDFParametersSettings,
  VaultExportImport,
} from '../components';

const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useAppStore();
  const { user, token, isAuthenticated } = useAuthStore();
  const { theme, resolvedTheme } = useTheme();

  const settingsGroups = [
    {
      title: 'Giao diện',
      icon: (
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          />
        </svg>
      ),
      settings: [
        {
          name: 'Chế độ hiển thị',
          description: 'Chọn giao diện sáng, tối hoặc theo hệ thống',
          component: (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {theme === 'system'
                  ? `Hệ thống (${resolvedTheme})`
                  : theme === 'light'
                    ? 'Sáng'
                    : 'Tối'}
              </span>
              <ThemeToggle variant="dropdown" size="md" />
            </div>
          ),
        },
        {
          name: 'Kích thước chữ',
          description: 'Tùy chỉnh kích thước chữ hiển thị',
          component: <FontSizeSettings />,
        },
        {
          name: 'Ngôn ngữ',
          description: 'Chọn ngôn ngữ hiển thị ứng dụng',
          component: (
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="btn-secondary flex items-center gap-2"
            >
              {language === 'vi' ? (
                <>
                  <span>🇻🇳</span>
                  <span>Tiếng Việt</span>
                </>
              ) : (
                <>
                  <span>🇺🇸</span>
                  <span>English</span>
                </>
              )}
            </button>
          ),
        },
      ],
    },
    {
      title: 'Bảo mật',
      icon: (
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      settings: [
        {
          name: 'Auto-lock timeout',
          description: 'Tự động khóa ứng dụng sau thời gian không hoạt động',
          component: <AutoLockTimeoutSettings className="w-48" />,
        },
        {
          name: 'Clipboard auto-clear',
          description: 'Tự động xóa clipboard sau khi copy mật khẩu',
          component: <ClipboardTimeoutSettings className="w-48" />,
        },
        {
          name: 'KDF Parameters',
          description: 'Tùy chỉnh thông số mã hóa key derivation',
          component: <KDFParametersSettings className="w-64" />,
        },
      ],
    },
    {
      title: 'Dữ liệu & Sao lưu',
      icon: (
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
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
      settings: [
        {
          name: 'Export/Import Vault',
          description: 'Sao lưu và khôi phục dữ liệu vault',
          component: <VaultExportImport />,
          fullWidth: true,
        },
      ],
    },
    {
      title: 'Tài khoản',
      icon: (
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      settings: [
        {
          name: 'Thông tin tài khoản',
          description: user?.email || 'Chưa có thông tin',
          component: (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {user?.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.email}
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  // Show loading if not authenticated yet
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center animate-pulse-soft">
            <svg
              className="w-8 h-8 text-white"
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
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Đang xác thực...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
              >
                My Password Management
              </Link>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Cài đặt
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/vault" className="nav-link flex items-center gap-2">
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
                <span className="hidden sm:inline">Password Vault</span>
              </Link>

              <ThemeToggle variant="dropdown" size="md" />

              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-sm text-neutral-600 dark:text-neutral-400">
                  {user?.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-neutral-600 dark:text-neutral-400"
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
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                Cài đặt
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Tùy chỉnh ứng dụng theo sở thích của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-8">
          {settingsGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              className="animate-slide-up"
              style={{ animationDelay: `${groupIndex * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                  {group.icon}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {group.title}
                </h2>
              </div>

              <div className="space-y-4">
                {group.settings.map((setting, settingIndex) => (
                  <div
                    key={setting.name}
                    className="card p-6 animate-slide-up"
                    style={{
                      animationDelay: `${(groupIndex * group.settings.length + settingIndex) * 0.05}s`,
                    }}
                  >
                    {(setting as any).fullWidth ? (
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            {setting.name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {setting.description}
                          </p>
                        </div>
                        {setting.component}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            {setting.name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {setting.description}
                          </p>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          {setting.component}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div
          className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/vault"
              className="btn-primary flex items-center gap-3 justify-center"
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
              Mở Password Vault
            </Link>

            <Link
              to="/"
              className="btn-secondary flex items-center gap-3 justify-center"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Theme Preview */}
        <div
          className="mt-12 animate-slide-up"
          style={{ animationDelay: '0.6s' }}
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Xem trước giao diện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Theme Preview */}
            <div className="card p-6 bg-white border-2 border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-yellow-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Light Mode</h4>
                  <p className="text-sm text-gray-600">
                    Giao diện sáng, phù hợp ban ngày
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-blue-500 rounded-full w-3/4"></div>
                <div className="h-2 bg-gray-300 rounded-full w-1/2"></div>
                <div className="h-2 bg-gray-300 rounded-full w-2/3"></div>
              </div>
            </div>

            {/* Dark Theme Preview */}
            <div className="card p-6 bg-neutral-900 border-2 border-neutral-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-100">Dark Mode</h4>
                  <p className="text-sm text-neutral-400">
                    Giao diện tối, dễ chịu cho mắt
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-blue-400 rounded-full w-3/4"></div>
                <div className="h-2 bg-neutral-600 rounded-full w-1/2"></div>
                <div className="h-2 bg-neutral-600 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
