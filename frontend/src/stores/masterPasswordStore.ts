import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KDFParams } from '../utils/crypto';

interface MasterPasswordState {
  masterKey: string | null;
  kdfParams: KDFParams | null;
  isUnlocked: boolean;
  lastActivity: number;
  autoLockTimeout: number; // in milliseconds
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
}

export const useMasterPasswordStore = create<MasterPasswordState & MasterPasswordActions>()(
  persist(
    (set) => ({
      // State
      masterKey: null,
      kdfParams: null,
      isUnlocked: false,
      lastActivity: Date.now(),
      autoLockTimeout: 5 * 60 * 1000, // 5 minutes default
      isInitialized: false,
      lockReason: undefined,
      sensitiveData: {},

      // Actions
      setMasterKey: (key) =>
        set((state) => ({
          ...state,
          masterKey: key,
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
          isUnlocked: false,
          lastActivity: Date.now(),
          lockReason: reason,
          sensitiveData: {}, // Clear all sensitive data
        }));

        // Additional memory cleanup
        if (window.gc) {
          try {
            window.gc();
          } catch (e) {
            // Garbage collection not available
          }
        }

        // Dispatch lock event
        window.dispatchEvent(new CustomEvent('master-password-locked', { 
          detail: { reason } 
        }));
      },

      unlock: (key, params) =>
        set((state) => ({
          ...state,
          masterKey: key,
          kdfParams: params,
          isUnlocked: true,
          lastActivity: Date.now(),
          lockReason: undefined,
        })),

      clear: () =>
        set((state) => ({
          ...state,
          masterKey: null,
          kdfParams: null,
          isUnlocked: false,
          lastActivity: Date.now(),
          isInitialized: false,
          lockReason: undefined,
          sensitiveData: {},
        })),

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
          const { [key]: _removed, ...rest } = state.sensitiveData || {};
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
  const { isUnlocked, lastActivity, autoLockTimeout } = useMasterPasswordStore.getState();
  
  if (!isUnlocked) return true;
  
  const now = Date.now();
  const timeSinceActivity = now - lastActivity;
  
  return timeSinceActivity > autoLockTimeout;
};

export const shouldShowMasterPasswordPage = (): boolean => {
  const { isInitialized, isUnlocked } = useMasterPasswordStore.getState();
  
  // Show master password page if:
  // 1. Not initialized yet, OR
  // 2. Initialized but locked (either manually or by timeout)
  return !isInitialized || !isUnlocked || isMasterPasswordLocked();
};

export const getMasterPasswordStatus = () => {
  const state = useMasterPasswordStore.getState();
  const isLocked = isMasterPasswordLocked();
  
  return {
    isUnlocked: state.isUnlocked && !isLocked,
    isLocked,
    isInitialized: state.isInitialized,
    hasKDFParams: !!state.kdfParams,
    lockReason: state.lockReason,
    timeUntilLock: Math.max(0, state.autoLockTimeout - (Date.now() - state.lastActivity)),
  };
};

// Auto-lock functionality
let autoLockTimer: number | null = null;

export const startAutoLockTimer = () => {
  if (autoLockTimer) {
    clearInterval(autoLockTimer);
  }
  
  autoLockTimer = setInterval(() => {
    const { isUnlocked, autoLockTimeout, lastActivity, lock } = useMasterPasswordStore.getState();
    
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