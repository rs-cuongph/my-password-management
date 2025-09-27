import { createFileRoute } from '@tanstack/react-router';
import TOTPVerificationPage from '../pages/TOTPVerificationPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

const TOTPVerificationComponent = () => {
  const { tempToken } = Route.useSearch();
  return (
    <ProtectedRoute requireAuth={false}>
      <TOTPVerificationPage tempToken={tempToken} />
    </ProtectedRoute>
  );
};

export const Route = createFileRoute('/totp-verification')({
  component: TOTPVerificationComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tempToken: search.tempToken as string,
    };
  },
});
