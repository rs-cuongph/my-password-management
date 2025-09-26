import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'vi';
  isInitialized: boolean;
}

interface AppActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  setLanguage: (language: 'en' | 'vi') => void;
  initializeTheme: () => void;
  getResolvedTheme: () => 'light' | 'dark';
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

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        sidebarOpen: false,
        theme: 'system',
        language: 'vi',
        isInitialized: false,

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
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);