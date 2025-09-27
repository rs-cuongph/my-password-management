import { createFileRoute } from '@tanstack/react-router';
import TOTPSetupPage from '../pages/TOTPSetupPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

const TOTPSetupComponent = () => {
  const { tempToken } = Route.useSearch();
  return (
    <ProtectedRoute requireAuth={false}>
      <TOTPSetupPage tempToken={tempToken} />
    </ProtectedRoute>
  );
};

export const Route = createFileRoute('/totp-setup')({
  component: TOTPSetupComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tempToken: search.tempToken as string,
    };
  },
});
