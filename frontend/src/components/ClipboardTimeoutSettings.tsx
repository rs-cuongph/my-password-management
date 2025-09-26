import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

interface ClipboardTimeoutSettingsProps {
  className?: string;
}

const CLIPBOARD_TIMEOUT_OPTIONS = [
  { value: 5 * 1000, label: '5 giây' },
  { value: 10 * 1000, label: '10 giây' },
  { value: 15 * 1000, label: '15 giây' },
  { value: 30 * 1000, label: '30 giây' },
  { value: 60 * 1000, label: '1 phút' },
  { value: 2 * 60 * 1000, label: '2 phút' },
  { value: 5 * 60 * 1000, label: '5 phút' },
];

export const ClipboardTimeoutSettings: React.FC<ClipboardTimeoutSettingsProps> = ({ className }) => {
  const { clipboardAutoClearTimeout, setClipboardAutoClearTimeout } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = CLIPBOARD_TIMEOUT_OPTIONS.find(option => option.value === clipboardAutoClearTimeout) || CLIPBOARD_TIMEOUT_OPTIONS[2];

  const handleOptionSelect = (value: number) => {
    setClipboardAutoClearTimeout(value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
      >
        <span className="text-sm text-neutral-900 dark:text-neutral-100">
          {currentOption.label}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg">
          <div className="py-1">
            {CLIPBOARD_TIMEOUT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                  option.value === clipboardAutoClearTimeout
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};