import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore, isTokenExpired } from '../stores/authStore';
import { useMe } from '../services/authService';

interface AuthContextValue {
  // Auth state từ store
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Enhanced methods
  logout: () => void;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const checkIntervalRef = useRef<number | null>(null);

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout: storeLogout,
  } = useAuthStore();

  // Use getMe API to verify authentication
  const { data: userData, error: meError, isLoading: isMeLoading } = useMe();

  // Enhanced logout với cleanup
  const logout = React.useCallback(() => {
    // Clear all timers
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Clear store
    storeLogout();

    // Redirect to login
    navigate({ to: '/login' });
  }, [storeLogout, navigate]);

  // Check auth status with getMe API verification
  const checkAuthStatus = React.useCallback((): boolean => {
    if (!token || isTokenExpired(token)) {
      if (isAuthenticated) {
        logout();
      }
      return false;
    }

    // If we have a valid token but getMe API failed, user is not authenticated
    if (isAuthenticated && meError && !isMeLoading) {
      logout();
      return false;
    }

    return true;
  }, [token, isAuthenticated, meError, isMeLoading, logout]);

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

  // Handle getMe API response
  useEffect(() => {
    if (userData && isAuthenticated) {
      // Merge user data with existing kdfSalt if available
      const { user: currentUser, setUser } = useAuthStore.getState();
      const userWithKdf = {
        ...userData,
        kdfSalt: currentUser?.kdfSalt || userData.kdfSalt,
      };
      setUser(userWithKdf);
    }
  }, [userData, isAuthenticated]);

  // Initialize timers khi auth state thay đổi
  useEffect(() => {
    if (isAuthenticated && token) {
      setupAuthCheck();
    } else {
      // Clear timers khi không authenticated
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, token, setupAuthCheck]);

  // Check auth status on mount
  useEffect(() => {
    if (token && !checkAuthStatus()) {
      // Token expired on mount
      return;
    }

    // Setup timers for valid token
    if (isAuthenticated && token) {
      setupAuthCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkAuthStatus]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isMeLoading,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
