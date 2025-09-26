import React, { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { shouldShowMasterPasswordPage } from '../stores/masterPasswordStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // true = requires auth, false = requires no auth (guest only)
  redirectTo?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
}) => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const location = useLocation();

  // Check auth status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Show loading spinner nếu đang check auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Custom fallback component
  if (fallback && ((requireAuth && !isAuthenticated) || (!requireAuth && isAuthenticated))) {
    return <>{fallback}</>;
  }

  // Route yêu cầu authentication nhưng user chưa login
  if (requireAuth && !isAuthenticated) {
    const loginRedirect = redirectTo || '/login';
    return <Navigate to={loginRedirect} search={{ redirect: location.pathname }} replace />;
  }

  // Route dành cho guest (như login, register) nhưng user đã login
  if (!requireAuth && isAuthenticated) {
    const homeRedirect = redirectTo || '/';
    return <Navigate to={homeRedirect} replace />;
  }

  // Check master password status for authenticated users
  if (requireAuth && isAuthenticated && shouldShowMasterPasswordPage()) {
    // Don't redirect if already on master password page
    if (location.pathname !== '/master-password') {
      return <Navigate to="/master-password" replace />;
    }
  }

  // Render children nếu auth status phù hợp
  return <>{children}</>;
};

// Higher-order component cho protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook để check auth trong components
export const useRequireAuth = (redirectTo?: string) => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const loginUrl = redirectTo || '/login';
      // Use window.location để force redirect
      const redirectUrl = `${loginUrl}?redirect=${encodeURIComponent(location.pathname)}`;
      window.location.href = redirectUrl;
    }
  }, [isAuthenticated, isLoading, redirectTo, location.pathname]);

  return { isAuthenticated, isLoading };
};

// Hook để prevent authenticated users từ accessing guest-only pages
export const useRequireGuest = (redirectTo?: string) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const homeUrl = redirectTo || '/';
      window.location.href = homeUrl;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
};