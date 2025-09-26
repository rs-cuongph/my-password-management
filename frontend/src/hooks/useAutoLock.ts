import { useEffect, useCallback, useRef } from 'react';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';

interface UseAutoLockOptions {
  onLock?: () => void;
  onUnlock?: () => void;
  onActivityDetected?: () => void;
}

export const useAutoLock = (options: UseAutoLockOptions = {}) => {
  const { onLock, onUnlock, onActivityDetected } = options;
  const timerRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  const {
    isUnlocked,
    lastActivity,
    autoLockTimeout,
    lock,
    updateActivity,
  } = useMasterPasswordStore();

  // Activity events that should reset the timer
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  // Handle activity detection
  const handleActivity = useCallback(() => {
    if (isUnlocked && isActiveRef.current) {
      updateActivity();
      onActivityDetected?.();
    }
  }, [isUnlocked, updateActivity, onActivityDetected]);

  // Handle visibility change (tab focus/blur)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab lost focus
      isActiveRef.current = false;
      // Immediately check if we should lock due to inactivity
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      if (isUnlocked && timeSinceActivity > autoLockTimeout) {
        lock();
        onLock?.();
      }
    } else {
      // Tab gained focus
      isActiveRef.current = true;
      // Check if we should be locked due to inactivity while tab was hidden
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      if (isUnlocked && timeSinceActivity > autoLockTimeout) {
        lock();
        onLock?.();
      } else if (isUnlocked) {
        // Tab is focused and we're still unlocked, reset activity
        updateActivity();
      }
    }
  }, [isUnlocked, lastActivity, autoLockTimeout, lock, updateActivity, onLock]);

  // Start auto-lock timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      if (!isUnlocked) return;

      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity > autoLockTimeout) {
        lock();
        onLock?.();
      }
    }, 1000); // Check every second
  }, [isUnlocked, lastActivity, autoLockTimeout, lock, onLock]);

  // Stop auto-lock timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (isUnlocked) {
      // Add activity listeners
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      // Add visibility change listener
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start the timer
      startTimer();
    } else {
      // Remove all listeners and stop timer when locked
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTimer();
    }

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTimer();
    };
  }, [isUnlocked, handleActivity, handleVisibilityChange, startTimer, stopTimer, activityEvents]);

  // Handle unlock state changes
  useEffect(() => {
    if (isUnlocked) {
      onUnlock?.();
    }
  }, [isUnlocked, onUnlock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // Get time until lock
  const getTimeUntilLock = useCallback(() => {
    if (!isUnlocked) return 0;
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    return Math.max(0, autoLockTimeout - timeSinceActivity);
  }, [isUnlocked, lastActivity, autoLockTimeout]);

  // Manual lock function
  const lockNow = useCallback(() => {
    lock();
    onLock?.();
  }, [lock, onLock]);

  return {
    isUnlocked,
    timeUntilLock: getTimeUntilLock(),
    lockNow,
    isTabActive: isActiveRef.current,
  };
};