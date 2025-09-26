import React from 'react';
import { useAppStore } from '../stores/appStore';

interface FontSizeSettingsProps {
  className?: string;
}

export const FontSizeSettings: React.FC<FontSizeSettingsProps> = ({ className }) => {
  const { fontSize, setFontSize } = useAppStore();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => setFontSize('normal')}
        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
          fontSize === 'normal'
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:border-primary-500 dark:hover:border-primary-400'
        }`}
      >
        Bình thường
      </button>
      <button
        onClick={() => setFontSize('large')}
        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
          fontSize === 'large'
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:border-primary-500 dark:hover:border-primary-400'
        }`}
      >
        Lớn
      </button>
    </div>
  );
};