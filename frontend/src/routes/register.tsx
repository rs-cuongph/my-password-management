import { createFileRoute } from '@tanstack/react-router';
import RegisterPage from '../pages/RegisterPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/register')({
  component: () => (
    <ProtectedRoute requireAuth={false}>
      <RegisterPage />
    </ProtectedRoute>
  ),
});