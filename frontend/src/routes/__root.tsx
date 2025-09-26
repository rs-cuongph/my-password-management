import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AuthProvider } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

const RootComponent = () => {
  const { isInitialized } = useTheme();

  // Show loading screen while theme is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse-soft">
          <div className="w-8 h-8 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </AuthProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});