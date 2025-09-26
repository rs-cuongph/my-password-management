import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'vi';
  fontSize: 'normal' | 'large';
  clipboardAutoClearTimeout: number; // in milliseconds
  isInitialized: boolean;
  // Accessibility settings
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderAnnouncements: boolean;
}

interface AppActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  setLanguage: (language: 'en' | 'vi') => void;
  setFontSize: (fontSize: 'normal' | 'large') => void;
  setClipboardAutoClearTimeout: (timeout: number) => void;
  initializeTheme: () => void;
  getResolvedTheme: () => 'light' | 'dark';
  // Accessibility actions
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setReducedMotion: (enabled: boolean) => void;
  toggleReducedMotion: () => void;
  setScreenReaderAnnouncements: (enabled: boolean) => void;
  toggleScreenReaderAnnouncements: () => void;
  initializeAccessibility: () => void;
}

// Helper function to get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Helper function to apply theme to document
const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#fafafa');
    }
  }
};

// Helper function to apply accessibility settings
const applyAccessibilitySettings = (highContrast: boolean, reducedMotion: boolean) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    // High contrast mode
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }
};

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        sidebarOpen: false,
        theme: 'system',
        language: 'vi',
        fontSize: 'normal',
        clipboardAutoClearTimeout: 15 * 1000, // 15 seconds default
        isInitialized: false,
        // Accessibility state
        highContrast: false,
        reducedMotion: false,
        screenReaderAnnouncements: true,

        // Actions
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            undefined,
            'toggleSidebar'
          ),

        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }, undefined, 'setSidebarOpen'),

        setTheme: (theme) => {
          set({ theme }, undefined, 'setTheme');
          const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
          applyTheme(resolvedTheme);
        },

        toggleTheme: () => {
          const currentResolved = get().getResolvedTheme();
          const newTheme = currentResolved === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        setLanguage: (language) =>
          set({ language }, undefined, 'setLanguage'),

        setFontSize: (fontSize) =>
          set({ fontSize }, undefined, 'setFontSize'),

        setClipboardAutoClearTimeout: (timeout) =>
          set({ clipboardAutoClearTimeout: timeout }, undefined, 'setClipboardAutoClearTimeout'),

        initializeTheme: () => {
          const { theme } = get();
          const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
          applyTheme(resolvedTheme);
          set({ isInitialized: true });

          // Listen for system theme changes
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
              const { theme } = get();
              if (theme === 'system') {
                applyTheme(getSystemTheme());
              }
            };
            mediaQuery.addEventListener('change', handleChange);
            
            // Cleanup function would be returned here in a useEffect
            return () => mediaQuery.removeEventListener('change', handleChange);
          }
        },

        getResolvedTheme: () => {
          const { theme } = get();
          return theme === 'system' ? getSystemTheme() : theme;
        },

        // Accessibility actions
        setHighContrast: (enabled) => {
          set({ highContrast: enabled }, undefined, 'setHighContrast');
          const { reducedMotion } = get();
          applyAccessibilitySettings(enabled, reducedMotion);
        },

        toggleHighContrast: () => {
          const { highContrast } = get();
          get().setHighContrast(!highContrast);
        },

        setReducedMotion: (enabled) => {
          set({ reducedMotion: enabled }, undefined, 'setReducedMotion');
          const { highContrast } = get();
          applyAccessibilitySettings(highContrast, enabled);
        },

        toggleReducedMotion: () => {
          const { reducedMotion } = get();
          get().setReducedMotion(!reducedMotion);
        },

        setScreenReaderAnnouncements: (enabled) =>
          set({ screenReaderAnnouncements: enabled }, undefined, 'setScreenReaderAnnouncements'),

        toggleScreenReaderAnnouncements: () => {
          const { screenReaderAnnouncements } = get();
          get().setScreenReaderAnnouncements(!screenReaderAnnouncements);
        },

        initializeAccessibility: () => {
          const { highContrast, reducedMotion } = get();

          // Detect system preferences
          const prefersReducedMotion = typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          if (prefersReducedMotion && !reducedMotion) {
            get().setReducedMotion(true);
          }

          // Apply current settings
          applyAccessibilitySettings(highContrast, reducedMotion);

          // Listen for system motion preference changes
          if (typeof window !== 'undefined') {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            const handleMotionChange = () => {
              get().setReducedMotion(motionQuery.matches);
            };
            motionQuery.addEventListener('change', handleMotionChange);

            return () => motionQuery.removeEventListener('change', handleMotionChange);
          }
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          fontSize: state.fontSize,
          clipboardAutoClearTimeout: state.clipboardAutoClearTimeout,
          highContrast: state.highContrast,
          reducedMotion: state.reducedMotion,
          screenReaderAnnouncements: state.screenReaderAnnouncements,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);