import { createFileRoute } from '@tanstack/react-router';
import MasterPasswordPage from '../pages/MasterPasswordPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/master-password')({
  component: () => (
    <ProtectedRoute requireAuth={true}>
      <MasterPasswordPage />
    </ProtectedRoute>
  ),
});
