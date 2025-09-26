import { createFileRoute } from '@tanstack/react-router';
import LoginPage from '../pages/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/login')({
  component: () => (
    <ProtectedRoute requireAuth={false}>
      <LoginPage />
    </ProtectedRoute>
  ),
});