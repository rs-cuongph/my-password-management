import { createFileRoute } from '@tanstack/react-router';
import TOTPSetupPage from '../pages/TOTPSetupPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/totp-setup')({
  component: () => {
    const { tempToken } = Route.useSearch();
    return (
      <ProtectedRoute requireAuth={false}>
        <TOTPSetupPage tempToken={tempToken} />
      </ProtectedRoute>
    );
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tempToken: search.tempToken as string,
    };
  },
});