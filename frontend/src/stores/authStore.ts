import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: !!user,
        })),

      setToken: (token) =>
        set((state) => ({
          ...state,
          token,
        })),

      login: (user, token) =>
        set((state) => ({
          ...state,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })),

      logout: () =>
        set((state) => ({
          ...state,
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })),

      setLoading: (loading) =>
        set((state) => ({
          ...state,
          isLoading: loading,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);