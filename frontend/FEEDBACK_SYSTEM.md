# Feedback System Documentation

A comprehensive feedback system for the Vibe Kanban application providing toast notifications, status indicators, loading states, error boundaries, and auto-lock warnings.

## 🚀 Quick Start

```tsx
import { useToast, StatusIndicator, SkeletonLoader, ErrorBoundary } from '../components';

// Basic toast usage
const { addToast } = useToast();
addToast({
  message: 'Operation completed successfully!',
  type: 'success',
  duration: 3000,
  showProgress: true
});
```

## 📁 Components Overview

### 1. Toast Notifications (`ToastContext.tsx`)

Enhanced toast system with countdown timers, progress bars, and action buttons.

#### Features:
- ✅ Multiple toast types: `success`, `error`, `warning`, `info`
- ✅ Progress bars for timed toasts
- ✅ Countdown timers with customizable display
- ✅ Action buttons for interactive toasts
- ✅ Persistent toasts that don't auto-dismiss
- ✅ Smooth animations and transitions

#### Usage:
```tsx
import { useToast } from '../contexts/ToastContext';

const { addToast, removeToast, updateToast } = useToast();

// Basic toast
addToast({
  message: 'Success message',
  type: 'success',
  duration: 3000
});

// Advanced toast with progress and action
addToast({
  message: 'File uploaded successfully',
  type: 'success',
  duration: 5000,
  showProgress: true,
  action: {
    label: 'View File',
    onClick: () => navigateToFile()
  }
});

// Persistent error toast
addToast({
  message: 'Critical error occurred',
  type: 'error',
  persistent: true,
  action: {
    label: 'Retry',
    onClick: retryOperation
  }
});
```

### 2. Status Indicators (`StatusIndicator.tsx`)

Visual indicators for different application states.

#### Components:
- `StatusIndicator` - Base component with multiple variants
- `SaveStatus` - Specialized for save operations
- `SyncStatus` - For synchronization status
- `ConnectionStatus` - Network connectivity status

#### Usage:
```tsx
import { StatusIndicator, SaveStatus } from '../components';

// Basic status indicator
<StatusIndicator 
  status="saving" 
  message="Saving changes..."
  variant="badge"
  size="sm"
/>

// Save status with auto-formatting
<SaveStatus 
  isSaving={isSaving}
  lastSaved={lastSaved}
  error={saveError}
/>

// All status types
<StatusIndicator status="idle" />      // Ready state
<StatusIndicator status="saving" />    // Saving with spinner
<StatusIndicator status="syncing" />   // Syncing with spinner
<StatusIndicator status="success" />   // Success with checkmark
<StatusIndicator status="error" />     // Error with X
<StatusIndicator status="warning" />   // Warning with triangle
```

### 3. Skeleton Loading (`SkeletonLoader.tsx`)

Loading placeholders for better perceived performance.

#### Components:
- `Skeleton` - Base skeleton component
- `SkeletonText`, `SkeletonTitle`, `SkeletonButton` - Text elements
- `SkeletonCard`, `SkeletonList`, `SkeletonTable` - Complex layouts
- `VaultLoadingSkeleton`, `AuthLoadingSkeleton` - Page-specific skeletons

#### Usage:
```tsx
import { SkeletonLoader, VaultLoadingSkeleton, LoadingScreen } from '../components';

// Basic skeletons
<SkeletonText lines={3} />
<SkeletonTitle width="60%" />
<SkeletonButton width={120} height={40} />

// Complex layouts
<SkeletonCard showHeader showFooter lines={3} />
<SkeletonList items={5} showAvatar />

// Page-specific loading
<LoadingScreen fullScreen>
  <VaultLoadingSkeleton />
</LoadingScreen>

// Custom skeleton with wave animation
<Skeleton 
  variant="rectangular"
  width="100%"
  height={200}
  animation="wave"
/>
```

### 4. Error Boundaries (`ErrorBoundary.tsx`)

Graceful error handling with user-friendly messages.

#### Features:
- ✅ Multiple error levels: `component`, `page`, `critical`
- ✅ Retry functionality
- ✅ Error details for developers
- ✅ Copy error information to clipboard
- ✅ Custom fallback components
- ✅ Automatic error reporting

#### Usage:
```tsx
import { ErrorBoundary, PageErrorBoundary, withErrorBoundary } from '../components';

// Wrap entire pages
<PageErrorBoundary onError={handleError}>
  <MyPage />
</PageErrorBoundary>

// Wrap individual components
<ErrorBoundary level="component">
  <MyComponent />
</ErrorBoundary>

// HOC pattern
const SafeComponent = withErrorBoundary(MyComponent, {
  level: 'component',
  onError: (error, errorInfo) => {
    console.log('Component error:', error);
  }
});

// Custom fallback
<ErrorBoundary 
  fallback={(error, errorInfo, retry) => (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={retry}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

### 5. Auto-lock Warnings (`AutoLockWarning.tsx`)

Smart notifications for vault auto-lock functionality.

#### Features:
- ✅ Configurable warning thresholds
- ✅ Progressive urgency (info → warning → error)
- ✅ Session extension functionality
- ✅ Banner and toast notifications
- ✅ Real-time countdown

#### Usage:
```tsx
import { AutoLockWarning, AutoLockWarningBanner, useAutoLockWarning } from '../components';

// Auto warning system (invisible component)
<AutoLockWarning 
  warningThresholds={[300, 60, 30, 10]} // 5min, 1min, 30sec, 10sec
  enabled={true}
/>

// Warning banner in UI
<AutoLockWarningBanner showWhen={60} />

// Hook for custom implementations
const { timeUntilLock, isWarningActive, isUrgent, isCritical } = useAutoLockWarning({
  warningThresholds: [300, 60, 30, 10],
  onWarning: (timeLeft) => console.log(`Warning: ${timeLeft} seconds left`),
  onLockImminent: () => console.log('About to lock!')
});
```

## 🎯 Hooks for Easy Integration

### `useSaveState()`
Manages save operations with automatic feedback.

```tsx
import { useSaveState } from '../hooks/useFeedback';

const { isSaving, lastSaved, saveError, save, resetSaveState } = useSaveState();

const handleSave = async () => {
  await save(async () => {
    // Your save logic here
    await api.saveData(data);
  }, {
    successMessage: 'Data saved successfully!',
    errorMessage: 'Failed to save data',
    showProgress: true
  });
};
```

### `useAsyncOperation()`
Generic hook for async operations with loading states.

```tsx
import { useAsyncOperation } from '../hooks/useFeedback';

const { isLoading, error, data, execute, reset } = useAsyncOperation();

const loadData = async () => {
  await execute(
    () => api.fetchData(),
    {
      successMessage: 'Data loaded successfully',
      showSuccessToast: true
    }
  );
};
```

### `useCopyFeedback()`
Enhanced copy functionality with feedback.

```tsx
import { useCopyFeedback } from '../hooks/useFeedback';

const { copyWithFeedback } = useCopyFeedback();

const handleCopy = async () => {
  await copyWithFeedback(textToCopy, {
    type: 'password',
    successMessage: 'Password copied to clipboard',
    showCountdown: true,
    clearTimeout: 30
  });
};
```

## 🎨 Styling and Theming

All components support dark mode and use the application's design system:

### Color Scheme:
- **Success**: Green tones (`success-*`)
- **Error**: Red tones (`error-*`)
- **Warning**: Orange/Yellow tones (`warning-*`)
- **Info**: Blue tones (`primary-*`)
- **Neutral**: Gray tones (`neutral-*`)

### Animations:
- Toast slide-in/out animations
- Progress bar transitions
- Skeleton pulse/wave effects
- Error boundary fade-ins
- Status indicator spins/pulses

## 🔧 Configuration

### Toast Configuration:
```tsx
// In ToastProvider or individual toasts
const toastConfig = {
  duration: 5000,           // Auto-dismiss time (0 = persistent)
  showProgress: true,       // Show progress bar
  showCountdown: true,      // Show countdown text
  persistent: false,        // Never auto-dismiss
  action: {                 // Action button
    label: 'Action',
    onClick: () => {}
  }
};
```

### Auto-lock Configuration:
```tsx
// Warning thresholds in seconds
const warningThresholds = [
  300,  // 5 minutes
  60,   // 1 minute
  30,   // 30 seconds
  10    // 10 seconds (critical)
];
```

### Error Boundary Configuration:
```tsx
const errorConfig = {
  level: 'component',       // 'component' | 'page' | 'critical'
  isolate: true,           // Only catch direct children errors
  onError: (error, info) => {
    // Custom error handling
    reportToErrorService(error, info);
  }
};
```

## 📱 Responsive Design

All components are fully responsive and work across different screen sizes:

- **Mobile**: Compact layouts, touch-friendly interactions
- **Tablet**: Medium-sized components, optimized spacing
- **Desktop**: Full-featured layouts with all details

## ♿ Accessibility

Components follow accessibility best practices:

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** color schemes
- **Focus management** for interactive elements
- **Semantic HTML** structure

## 🧪 Testing

### Demo Page
Visit `/feedback-demo` to see all components in action with:
- Live toast examples
- Status indicator demonstrations
- Loading state previews
- Error boundary testing
- Auto-lock warning simulations

### Integration Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../contexts/ToastContext';

test('toast notification shows and dismisses', async () => {
  render(
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
  
  // Test implementation here
});
```

## 🚀 Best Practices

1. **Toast Usage**:
   - Use appropriate types (`success`, `error`, `warning`, `info`)
   - Keep messages concise and actionable
   - Use progress bars for operations with known duration
   - Provide actions for recoverable errors

2. **Loading States**:
   - Show skeletons immediately when loading starts
   - Match skeleton structure to actual content
   - Use wave animations for longer loading operations

3. **Error Handling**:
   - Wrap components at appropriate boundaries
   - Provide meaningful error messages to users
   - Include retry functionality where possible
   - Log detailed errors for developers

4. **Status Indicators**:
   - Update status in real-time
   - Use consistent terminology across the app
   - Provide clear visual feedback for all states

## 📚 API Reference

### Toast Interface
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;          // Auto-dismiss time in ms
  countdown?: number;         // Countdown display
  showCountdown?: boolean;    // Show countdown text
  showProgress?: boolean;     // Show progress bar
  persistent?: boolean;       // Never auto-dismiss
  action?: {                  // Action button
    label: string;
    onClick: () => void;
  };
}
```

### Status Types
```typescript
type StatusType = 'idle' | 'saving' | 'syncing' | 'success' | 'error' | 'warning';
```

### Error Levels
```typescript
type ErrorLevel = 'component' | 'page' | 'critical';
```

## 🎭 Examples

Check out the comprehensive demo at `/feedback-demo` or see the `FeedbackSystemDemo.tsx` component for complete implementation examples.

---

This feedback system provides a complete solution for user feedback in modern React applications, with a focus on accessibility, performance, and user experience.