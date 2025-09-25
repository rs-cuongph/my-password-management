import { createFileRoute } from '@tanstack/react-router';
import TOTPVerificationPage from '../pages/TOTPVerificationPage';

export const Route = createFileRoute('/totp-verification')({
  component: () => {
    const { tempToken } = Route.useSearch();
    return <TOTPVerificationPage tempToken={tempToken} />;
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tempToken: search.tempToken as string,
    };
  },
});