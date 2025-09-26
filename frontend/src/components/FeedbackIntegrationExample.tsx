import React, { useState } from 'react';
import { useSaveState, useAsyncOperation, useCopyFeedback } from '../hooks/useFeedback';
import { SaveStatus, StatusIndicator, SkeletonText, SkeletonButton } from './index';
import { ComponentErrorBoundary } from './ErrorBoundary';

// Example of how to integrate the feedback system into a real component
export const FeedbackIntegrationExample: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', content: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  // Use the save state hook for form saving
  const { isSaving, lastSaved, saveError, save } = useSaveState();
  
  // Use async operation hook for loading data
  const { isLoading, execute: loadData } = useAsyncOperation();
  
  // Use copy feedback hook
  const { copyWithFeedback } = useCopyFeedback();

  // Simulate save operation
  const handleSave = async () => {
    await save(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random failure (30% chance)
      if (Math.random() < 0.3) {
        throw new Error('Network timeout - please try again');
      }
      
      console.log('Form saved:', formData);
    }, {
      successMessage: 'Form data saved successfully!',
      errorMessage: 'Failed to save form data',
      showProgress: true
    });
  };

  // Simulate data loading
  const handleLoadData = async () => {
    await loadData(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { message: 'Data loaded successfully' };
    }, {
      successMessage: 'Data refreshed',
      showSuccessToast: true
    });
  };

  // Copy form data as JSON
  const handleCopyData = async () => {
    const jsonData = JSON.stringify(formData, null, 2);
    await copyWithFeedback(jsonData, {
      type: 'JSON data',
      successMessage: 'Form data copied to clipboard',
      showCountdown: true,
      clearTimeout: 15
    });
  };

  // Simulate skeleton loading
  const showSkeletonDemo = () => {
    setShowSkeleton(true);
    setTimeout(() => setShowSkeleton(false), 3000);
  };

  return (
    <ComponentErrorBoundary>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Feedback System Integration Example
            </h2>
            <SaveStatus 
              isSaving={isSaving}
              lastSaved={lastSaved || undefined}
              error={saveError || undefined}
            />
          </div>

          {showSkeleton ? (
            <div className="space-y-4">
              <SkeletonText lines={1} width="30%" />
              <SkeletonText lines={3} />
              <div className="flex gap-3">
                <SkeletonButton width={100} />
                <SkeletonButton width={120} />
                <SkeletonButton width={80} />
              </div>
            </div>
          ) : (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-primary"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-primary"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="input-primary resize-none"
                  rows={4}
                  placeholder="Enter your message"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save Form'}
                </button>

                <button
                  type="button"
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  {isLoading && (
                    <StatusIndicator 
                      status="syncing" 
                      showIcon={true}
                      showMessage={false}
                      size="sm"
                      variant="minimal"
                    />
                  )}
                  {isLoading ? 'Loading...' : 'Refresh Data'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyData}
                  className="btn-ghost"
                >
                  Copy JSON
                </button>

                <button
                  type="button"
                  onClick={showSkeletonDemo}
                  className="btn-ghost"
                >
                  Show Skeleton
                </button>
              </div>
            </form>
          )}

          {/* Status indicators section */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
              Component Status
            </h3>
            <div className="flex flex-wrap gap-4">
              <StatusIndicator 
                status={isSaving ? 'saving' : 'idle'} 
                variant="badge" 
                size="sm" 
              />
              <StatusIndicator 
                status={isLoading ? 'syncing' : 'idle'} 
                variant="badge" 
                size="sm" 
              />
              {saveError && (
                <StatusIndicator 
                  status="error" 
                  message="Save failed"
                  variant="badge" 
                  size="sm" 
                />
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              💡 Integration Features Demonstrated:
            </h4>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>✅ Save state management with automatic feedback</li>
              <li>✅ Loading states with status indicators</li>
              <li>✅ Copy functionality with countdown feedback</li>
              <li>✅ Skeleton loading during async operations</li>
              <li>✅ Error boundaries for graceful error handling</li>
              <li>✅ Real-time status updates in UI</li>
            </ul>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
};

export default FeedbackIntegrationExample;