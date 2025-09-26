import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useAuthStore, isTokenExpired, getTokenExpiration } from '../stores/authStore';
// import { authApi } from '../services/authService';

interface AuthContextValue {
  // Auth state từ store
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Enhanced methods
  logout: () => void;
  checkAuthStatus: () => boolean;
  refreshTokenIfNeeded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const refreshTimerRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout: storeLogout,
    setLoading
  } = useAuthStore();

  // Enhanced logout với cleanup
  const logout = React.useCallback(() => {
    // Clear all timers
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Clear store
    storeLogout();

    // Redirect to login
    navigate({ to: '/login' });
  }, [storeLogout, navigate]);

  // Check auth status
  const checkAuthStatus = React.useCallback((): boolean => {
    if (!token || isTokenExpired(token)) {
      if (isAuthenticated) {
        logout();
      }
      return false;
    }
    return true;
  }, [token, isAuthenticated, logout]);

  // Refresh token nếu cần
  const refreshTokenIfNeeded = React.useCallback(async (): Promise<void> => {
    if (!token || !isAuthenticated) return;

    const expiration = getTokenExpiration(token);
    if (!expiration) return;

    const now = Date.now();
    const timeUntilExpiration = expiration - now;

    // Refresh nếu token sẽ hết hạn trong 5 phút
    if (timeUntilExpiration <= 5 * 60 * 1000) {
      try {
        setLoading(true);
        // For now, just logout if token is expired
        logout();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    }
  }, [token, isAuthenticated, login, logout, setLoading]);

  // Setup token refresh timer
  const setupRefreshTimer = React.useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!token || !isAuthenticated) return;

    const expiration = getTokenExpiration(token);
    if (!expiration) return;

    const now = Date.now();
    const timeUntilExpiration = expiration - now;

    // Refresh 5 phút trước khi hết hạn
    const refreshTime = Math.max(timeUntilExpiration - 5 * 60 * 1000, 60 * 1000);

    refreshTimerRef.current = setTimeout(() => {
      refreshTokenIfNeeded();
    }, refreshTime);
  }, [token, isAuthenticated, refreshTokenIfNeeded]);

  // Setup periodic auth check
  const setupAuthCheck = React.useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Check auth status mỗi phút
    checkIntervalRef.current = setInterval(() => {
      checkAuthStatus();
    }, 60 * 1000);
  }, [checkAuthStatus]);

  // Initialize timers khi auth state thay đổi
  useEffect(() => {
    if (isAuthenticated && token) {
      setupRefreshTimer();
      setupAuthCheck();
    } else {
      // Clear timers khi không authenticated
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, token, setupRefreshTimer, setupAuthCheck]);

  // Check auth status on mount
  useEffect(() => {
    if (token && !checkAuthStatus()) {
      // Token expired on mount
      return;
    }

    // Setup timers for valid token
    if (isAuthenticated && token) {
      setupRefreshTimer();
      setupAuthCheck();
    }
  }, []);

  // Listen for storage events (multiple tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-storage') {
        // Auth state changed in another tab
        const newState = event.newValue ? JSON.parse(event.newValue) : null;

        if (!newState?.state?.isAuthenticated && isAuthenticated) {
          // Logged out in another tab
          logout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, logout]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Page became visible, check auth status
        checkAuthStatus();
        refreshTokenIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkAuthStatus, refreshTokenIfNeeded]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout,
    checkAuthStatus,
    refreshTokenIfNeeded,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};