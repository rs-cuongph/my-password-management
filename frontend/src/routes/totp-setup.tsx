import { createFileRoute } from '@tanstack/react-router';
import TOTPSetupPage from '../pages/TOTPSetupPage';

export const Route = createFileRoute('/totp-setup')({
  component: () => {
    const { tempToken } = Route.useSearch();
    return <TOTPSetupPage tempToken={tempToken} />;
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tempToken: search.tempToken as string,
    };
  },
});