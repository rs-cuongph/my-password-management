import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KDFParams } from '../utils/crypto';

interface MasterPasswordState {
  masterKey: string | null;
  masterPassword: string | null; // For compatibility with existing code
  kdfParams: KDFParams | null;
  isUnlocked: boolean;
  lastActivity: number;
  autoLockTimeout: number; // in milliseconds
  autoLockEnabled: boolean; // Whether auto-lock is enabled
  isInitialized: boolean;
  lockReason?: 'manual' | 'timeout' | 'focus_lost';
  sensitiveData?: Record<string, unknown>; // For storing sensitive data that should be cleared on lock
}

interface MasterPasswordActions {
  setMasterKey: (key: string) => void;
  setKDFParams: (params: KDFParams) => void;
  setIsUnlocked: (unlocked: boolean) => void;
  updateActivity: () => void;
  setAutoLockTimeout: (timeout: number) => void;
  lock: (reason?: 'manual' | 'timeout' | 'focus_lost') => void;
  unlock: (key: string, params: KDFParams) => void;
  clear: () => void;
  initialize: () => void;
  setSensitiveData: (key: string, data: unknown) => void;
  clearSensitiveData: (key?: string) => void;
  clearAllSensitiveData: () => void;
  extendSession: () => Promise<void>;
}

export const useMasterPasswordStore = create<
  MasterPasswordState & MasterPasswordActions
>()(
  persist(
    (set) => ({
      // State
      masterKey: null,
      masterPassword: null,
      kdfParams: null,
      isUnlocked: false,
      lastActivity: Date.now(),
      autoLockTimeout: 5 * 60 * 1000, // 5 minutes default
      autoLockEnabled: true,
      isInitialized: false,
      lockReason: undefined,
      sensitiveData: {},

      // Actions
      setMasterKey: (key) =>
        set((state) => ({
          ...state,
          masterKey: key,
          masterPassword: key, // Keep both for compatibility
        })),

      setKDFParams: (params) =>
        set((state) => ({
          ...state,
          kdfParams: params,
        })),

      setIsUnlocked: (unlocked) =>
        set((state) => ({
          ...state,
          isUnlocked: unlocked,
          lastActivity: unlocked ? Date.now() : state.lastActivity,
          lockReason: unlocked ? undefined : state.lockReason,
        })),

      updateActivity: () =>
        set((state) => ({
          ...state,
          lastActivity: Date.now(),
        })),

      setAutoLockTimeout: (timeout) =>
        set((state) => ({
          ...state,
          autoLockTimeout: timeout,
        })),

      lock: (reason = 'manual') => {
        // Clear sensitive data from memory
        set((state) => ({
          ...state,
          masterKey: null,
          masterPassword: null,
          isUnlocked: false,
          lastActivity: Date.now(),
          lockReason: reason,
          sensitiveData: {}, // Clear all sensitive data
        }));

        // Additional memory cleanup
        if (window.gc) {
          try {
            window.gc();
          } catch {
            // Garbage collection not available
          }
        }

        // Dispatch lock event
        window.dispatchEvent(
          new CustomEvent('master-password-locked', {
            detail: { reason },
          })
        );
      },

      unlock: (key, params) =>
        set((state) => ({
          ...state,
          masterKey: key,
          masterPassword: key,
          kdfParams: params,
          isUnlocked: true,
          lastActivity: Date.now(),
          lockReason: undefined,
        })),

      clear: () =>
        set((state) => ({
          ...state,
          masterKey: null,
          masterPassword: null,
          kdfParams: null,
          isUnlocked: false,
          lastActivity: Date.now(),
          isInitialized: false,
          lockReason: undefined,
          sensitiveData: {},
        })),

      extendSession: async () => {
        // Extend the session by updating the last activity
        set((state) => ({
          ...state,
          lastActivity: Date.now(),
        }));
      },

      initialize: () =>
        set((state) => ({
          ...state,
          isInitialized: true,
        })),

      setSensitiveData: (key, data) =>
        set((state) => ({
          ...state,
          sensitiveData: {
            ...state.sensitiveData,
            [key]: data,
          },
        })),

      clearSensitiveData: (key) =>
        set((state) => {
          if (!key) return state;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _, ...rest } = state.sensitiveData || {};
          return {
            ...state,
            sensitiveData: rest,
          };
        }),

      clearAllSensitiveData: () =>
        set((state) => ({
          ...state,
          sensitiveData: {},
        })),
    }),
    {
      name: 'master-password-storage',
      partialize: (state) => ({
        kdfParams: state.kdfParams,
        autoLockTimeout: state.autoLockTimeout,
        isInitialized: state.isInitialized,
        // Don't persist masterKey, isUnlocked, lastActivity, lockReason, or sensitiveData for security
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset security-sensitive state on rehydration
          state.masterKey = null;
          state.masterPassword = null;
          state.isUnlocked = false;
          state.lastActivity = Date.now();
          state.lockReason = undefined;
          state.sensitiveData = {};
        }
      },
    }
  )
);

// Utility functions
export const isMasterPasswordLocked = (): boolean => {
  const { isUnlocked, lastActivity, autoLockTimeout } =
    useMasterPasswordStore.getState();

  if (!isUnlocked) return true;

  const now = Date.now();
  const timeSinceActivity = now - lastActivity;

  return timeSinceActivity > autoLockTimeout;
};

export const shouldShowMasterPasswordPage = (): boolean => {
  const { isInitialized, isUnlocked, masterKey } =
    useMasterPasswordStore.getState();

  // Don't show master password page if we have a valid master key and are unlocked
  if (isUnlocked && masterKey && isInitialized) {
    return false;
  }

  // Show master password page if:
  // 1. Not initialized yet, OR
  // 2. Initialized but locked (either manually or by timeout), OR
  // 3. No master key available
  return (
    !isInitialized || !isUnlocked || !masterKey || isMasterPasswordLocked()
  );
};

export const getMasterPasswordStatus = () => {
  const state = useMasterPasswordStore.getState();
  const isLocked = isMasterPasswordLocked();

  return {
    isUnlocked: state.isUnlocked && !isLocked,
    isLocked,
    isInitialized: state.isInitialized,
    hasKDFParams: !!state.kdfParams,
    autoLockEnabled: state.autoLockEnabled,
    lockReason: state.lockReason,
    timeUntilLock: Math.max(
      0,
      state.autoLockTimeout - (Date.now() - state.lastActivity)
    ),
  };
};

// Auto-lock functionality
let autoLockTimer: number | null = null;

export const startAutoLockTimer = () => {
  if (autoLockTimer) {
    clearInterval(autoLockTimer);
  }

  autoLockTimer = setInterval(() => {
    const { isUnlocked, autoLockTimeout, lastActivity, lock } =
      useMasterPasswordStore.getState();

    if (isUnlocked) {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity > autoLockTimeout) {
        lock('timeout');
      }
    }
  }, 1000); // Check every second
};

export const stopAutoLockTimer = () => {
  if (autoLockTimer) {
    clearInterval(autoLockTimer);
    autoLockTimer = null;
  }
};

export const resetAutoLockTimer = () => {
  const { updateActivity } = useMasterPasswordStore.getState();
  updateActivity();
};
