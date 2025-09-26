import React, { useState } from 'react';
import CopyButton from './CopyButton';
import { useToast } from '../contexts/ToastContext';

export const ClipboardDemo: React.FC = () => {
  const [testUsername] = useState('demo@example.com');
  const [testPassword] = useState('SuperSecretPassword123!');
  const [customText, setCustomText] = useState('');
  const [customTimeout, setCustomTimeout] = useState(15);
  const { addToast } = useToast();

  const handleCopySuccess = (text: string, type: string) => {
    console.log(`Successfully copied ${type}:`, text);
  };

  const handleCopyError = (error: string) => {
    console.error('Copy failed:', error);
  };

  const testClipboardFeatures = () => {
    addToast({
      message: 'Testing clipboard features - check console for results',
      type: 'info',
      duration: 3000
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Clipboard Copy với Auto-Clear Demo
      </h1>

      <div className="space-y-6">
        {/* Basic Copy Examples */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Basic Copy Examples
          </h2>

          <div className="space-y-4">
            {/* Username Demo */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">Username:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                {testUsername}
              </code>
              <CopyButton
                text={testUsername}
                type="tài khoản"
                clearTimeout={10}
                size="sm"
                variant="outline"
                onCopySuccess={handleCopySuccess}
                onCopyError={handleCopyError}
              />
            </div>

            {/* Password Demo */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">Password:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                {testPassword}
              </code>
              <CopyButton
                text={testPassword}
                type="mật khẩu"
                clearTimeout={15}
                size="sm"
                variant="solid"
                onCopySuccess={handleCopySuccess}
                onCopyError={handleCopyError}
              />
            </div>
          </div>
        </div>

        {/* Custom Copy Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Custom Copy Test
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Text
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập text để copy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-clear Timeout (seconds)
              </label>
              <input
                type="number"
                value={customTimeout}
                onChange={(e) => setCustomTimeout(parseInt(e.target.value) || 15)}
                min="0"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Copy this:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                {customText || 'Enter some text above'}
              </code>
              <CopyButton
                text={customText}
                type="custom text"
                clearTimeout={customTimeout}
                size="md"
                variant="ghost"
                showCountdown={true}
                onCopySuccess={handleCopySuccess}
                onCopyError={handleCopyError}
                title={`Copy with ${customTimeout}s auto-clear`}
              />
            </div>
          </div>
        </div>

        {/* Size Variants */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Size & Style Variants
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-16">Small:</span>
              <CopyButton
                text="Small button test"
                type="small"
                clearTimeout={5}
                size="sm"
                variant="ghost"
              />
              <CopyButton
                text="Small outline test"
                type="small outline"
                clearTimeout={5}
                size="sm"
                variant="outline"
              />
              <CopyButton
                text="Small solid test"
                type="small solid"
                clearTimeout={5}
                size="sm"
                variant="solid"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-16">Medium:</span>
              <CopyButton
                text="Medium button test"
                type="medium"
                clearTimeout={10}
                size="md"
                variant="ghost"
              />
              <CopyButton
                text="Medium outline test"
                type="medium outline"
                clearTimeout={10}
                size="md"
                variant="outline"
              />
              <CopyButton
                text="Medium solid test"
                type="medium solid"
                clearTimeout={10}
                size="md"
                variant="solid"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-16">Large:</span>
              <CopyButton
                text="Large button test"
                type="large"
                clearTimeout={20}
                size="lg"
                variant="ghost"
              />
              <CopyButton
                text="Large outline test"
                type="large outline"
                clearTimeout={20}
                size="lg"
                variant="outline"
              />
              <CopyButton
                text="Large solid test"
                type="large solid"
                clearTimeout={20}
                size="lg"
                variant="solid"
              />
            </div>
          </div>
        </div>

        {/* Feature Testing */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Feature Testing
          </h2>

          <div className="space-y-3">
            <button
              onClick={testClipboardFeatures}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Test All Clipboard Features
            </button>

            <div className="text-xs text-gray-500">
              <p>• Copy buttons should show loading state</p>
              <p>• Toast notifications should appear</p>
              <p>• Countdown timers should show remaining time</p>
              <p>• Clipboard should auto-clear after timeout</p>
              <p>• Fallback copy method should work in non-secure contexts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipboardDemo;