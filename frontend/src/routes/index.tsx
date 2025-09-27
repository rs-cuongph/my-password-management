import { createFileRoute } from '@tanstack/react-router';
import HomePage from '../pages/HomePage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/')({
  component: () => (
    <ProtectedRoute requireAuth={true}>
      <HomePage />
    </ProtectedRoute>
  ),
});
