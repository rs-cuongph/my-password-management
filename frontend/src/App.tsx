import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './contexts/ToastContext';
import { useAppStore } from './stores/appStore';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { fontSize, initializeAccessibility } = useAppStore();

  // Apply font size class to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove('font-size-normal', 'font-size-large');
    body.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  // Initialize accessibility settings
  useEffect(() => {
    initializeAccessibility();
  }, [initializeAccessibility]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
