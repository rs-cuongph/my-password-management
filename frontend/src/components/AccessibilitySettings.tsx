import React from 'react';
import { useAppStore } from '../stores/appStore';

const AccessibilitySettings: React.FC = () => {
  const {
    fontSize,
    highContrast,
    reducedMotion,
    screenReaderAnnouncements,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReaderAnnouncements
  } = useAppStore();

  return (
    <section className="card p-6" role="region" aria-labelledby="accessibility-heading">
      <h2 id="accessibility-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        Cài đặt Accessibility
      </h2>

      <div className="space-y-6">
        {/* Font Size Setting */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Kích thước chữ
          </h3>
          <div className="space-y-2" role="radiogroup" aria-labelledby="font-size-group">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="fontSize"
                value="normal"
                checked={fontSize === 'normal'}
                onChange={() => setFontSize('normal')}
                className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 border-neutral-300"
                aria-describedby="normal-font-desc"
              />
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                Bình thường (16px)
              </span>
            </label>
            <p id="normal-font-desc" className="sr-only">
              Kích thước chữ tiêu chuẩn, dễ đọc cho hầu hết người dùng
            </p>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="fontSize"
                value="large"
                checked={fontSize === 'large'}
                onChange={() => setFontSize('large')}
                className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 border-neutral-300"
                aria-describedby="large-font-desc"
              />
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                Lớn (18px)
              </span>
            </label>
            <p id="large-font-desc" className="sr-only">
              Kích thước chữ lớn hơn, dễ đọc hơn cho người có vấn đề về thị lực
            </p>
          </div>
        </div>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Chế độ tương phản cao
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tăng độ tương phản để dễ nhìn hơn
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHighContrast}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${highContrast ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}
            `}
            role="switch"
            aria-checked={highContrast}
            aria-labelledby="high-contrast-label"
            aria-describedby="high-contrast-desc"
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${highContrast ? 'translate-x-5' : 'translate-x-0'}
              `}
              aria-hidden="true"
            />
          </button>
        </div>
        <p id="high-contrast-desc" className="sr-only">
          {highContrast ? 'Chế độ tương phản cao đang bật' : 'Chế độ tương phản cao đang tắt'}
        </p>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Giảm hiệu ứng chuyển động
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Giảm hoặc tắt các animation và transition
            </p>
          </div>
          <button
            type="button"
            onClick={toggleReducedMotion}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${reducedMotion ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}
            `}
            role="switch"
            aria-checked={reducedMotion}
            aria-labelledby="reduced-motion-label"
            aria-describedby="reduced-motion-desc"
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${reducedMotion ? 'translate-x-5' : 'translate-x-0'}
              `}
              aria-hidden="true"
            />
          </button>
        </div>
        <p id="reduced-motion-desc" className="sr-only">
          {reducedMotion ? 'Chế độ giảm chuyển động đang bật' : 'Chế độ giảm chuyển động đang tắt'}
        </p>

        {/* Screen Reader Announcements Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Thông báo cho screen reader
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Bật thông báo tự động cho phần mềm đọc màn hình
            </p>
          </div>
          <button
            type="button"
            onClick={toggleScreenReaderAnnouncements}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${screenReaderAnnouncements ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}
            `}
            role="switch"
            aria-checked={screenReaderAnnouncements}
            aria-labelledby="screen-reader-label"
            aria-describedby="screen-reader-desc"
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${screenReaderAnnouncements ? 'translate-x-5' : 'translate-x-0'}
              `}
              aria-hidden="true"
            />
          </button>
        </div>
        <p id="screen-reader-desc" className="sr-only">
          {screenReaderAnnouncements ? 'Thông báo screen reader đang bật' : 'Thông báo screen reader đang tắt'}
        </p>

        {/* Keyboard Navigation Help */}
        <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-950 rounded-xl border border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2">
            Hướng dẫn điều hướng bàn phím
          </h3>
          <ul className="text-xs text-primary-800 dark:text-primary-200 space-y-1">
            <li><kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Tab</kbd> - Di chuyển đến phần tử tiếp theo</li>
            <li><kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Shift + Tab</kbd> - Di chuyển đến phần tử trước</li>
            <li><kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Enter</kbd> hoặc <kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Space</kbd> - Kích hoạt phần tử</li>
            <li><kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Escape</kbd> - Đóng modal hoặc menu</li>
            <li><kbd className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900 rounded">Arrow Keys</kbd> - Điều hướng trong menu hoặc tab</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AccessibilitySettings;