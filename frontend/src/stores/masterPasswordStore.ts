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
}

interface MasterPasswordActions {
  setMasterKey: (key: string) => void;
  setKDFParams: (params: KDFParams) => void;
  setIsUnlocked: (unlocked: boolean) => void;
  updateActivity: () => void;
  setAutoLockTimeout: (timeout: number) => void;
  lock: () => void;
  unlock: (key: string, params: KDFParams) => void;
  clear: () => void;
  initialize: () => void;
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

      lock: () =>
        set((state) => ({
          ...state,
          masterKey: null,
          isUnlocked: false,
          lastActivity: Date.now(),
        })),

      unlock: (key, params) =>
        set((state) => ({
          ...state,
          masterKey: key,
          kdfParams: params,
          isUnlocked: true,
          lastActivity: Date.now(),
        })),

      clear: () =>
        set((state) => ({
          ...state,
          masterKey: null,
          kdfParams: null,
          isUnlocked: false,
          lastActivity: Date.now(),
          isInitialized: false,
        })),

      initialize: () =>
        set((state) => ({
          ...state,
          isInitialized: true,
        })),
    }),
    {
      name: 'master-password-storage',
      partialize: (state) => ({
        kdfParams: state.kdfParams,
        autoLockTimeout: state.autoLockTimeout,
        isInitialized: state.isInitialized,
        // Don't persist masterKey, isUnlocked, or lastActivity for security
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset security-sensitive state on rehydration
          state.masterKey = null;
          state.isUnlocked = false;
          state.lastActivity = Date.now();
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
        lock();
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('master-password-locked'));
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