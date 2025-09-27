import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export const useTheme = () => {
  const {
    theme,
    initializeTheme,
    setTheme,
    toggleTheme,
    getResolvedTheme,
    isInitialized,
  } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      const cleanup = initializeTheme();
      return cleanup;
    }
  }, [initializeTheme, isInitialized]);

  return {
    theme,
    resolvedTheme: getResolvedTheme(),
    setTheme,
    toggleTheme,
    isInitialized,
  };
};
