import { createFileRoute } from '@tanstack/react-router';
import * as v from 'valibot';
import LoginPage from '../pages/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

const loginSearchSchema = v.object({
  redirect: v.optional(v.string()),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: () => (
    <ProtectedRoute requireAuth={false}>
      <LoginPage />
    </ProtectedRoute>
  ),
});
