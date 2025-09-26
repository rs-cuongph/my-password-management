import { createFileRoute } from '@tanstack/react-router';
import SettingsPage from '../pages/SettingsPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/settings')({
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});