import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'vi';
}

interface AppActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'vi') => void;
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    (set) => ({
      // State
      sidebarOpen: false,
      theme: 'light',
      language: 'vi',

      // Actions
      toggleSidebar: () =>
        set(
          (state) => ({ sidebarOpen: !state.sidebarOpen }),
          undefined,
          'toggleSidebar'
        ),

      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }, undefined, 'setSidebarOpen'),

      setTheme: (theme) => set({ theme }, undefined, 'setTheme'),

      setLanguage: (language) =>
        set({ language }, undefined, 'setLanguage'),
    }),
    {
      name: 'app-store',
    }
  )
);