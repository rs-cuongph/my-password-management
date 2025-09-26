import { createFileRoute } from '@tanstack/react-router';
import FeedbackSystemDemo from '../components/FeedbackSystemDemo';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/feedback-demo')({
  component: () => (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
        <FeedbackSystemDemo />
      </div>
    </ProtectedRoute>
  ),
});