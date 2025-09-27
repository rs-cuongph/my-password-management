import { createFileRoute } from '@tanstack/react-router';
import VaultPage from '../pages/VaultPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/vault')({
  component: () => (
    <ProtectedRoute>
      <VaultPage />
    </ProtectedRoute>
  ),
});
