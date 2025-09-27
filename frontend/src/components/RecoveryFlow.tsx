import React, { useState, useEffect } from 'react';
import type { RecoveryWrappedDEK, RecoveryFlowState } from '../types/recovery';
import { recoveryService } from '../services/recoveryService';

interface RecoveryFlowProps {
  wrappedDEK: RecoveryWrappedDEK;
  salt: string;
  onSuccess: (dek: string) => void;
  onCancel: () => void;
}

export const RecoveryFlow: React.FC<RecoveryFlowProps> = ({
  wrappedDEK,
  salt,
  onSuccess,
  onCancel,
}) => {
  const [state, setState] = useState<RecoveryFlowState>({
    step: 'input',
    recoveryCode: '',
  });
  const [rawInput, setRawInput] = useState('');

  // Format input as user types
  useEffect(() => {
    const cleanInput = rawInput.replace(/[^A-Za-z2-7]/g, '').toUpperCase();
    if (cleanInput.length <= 32) {
      const formatted = cleanInput.replace(/(.{8})/g, '$1-').replace(/-$/, ''); // Remove trailing dash

      setState((prev) => ({ ...prev, recoveryCode: formatted }));
    }
  }, [rawInput]);

  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawInput(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.step !== 'input') return;

    // Validate format first
    const validation = recoveryService.validateCodeFormat(state.recoveryCode);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: validation.error,
      }));
      return;
    }

    setState((prev) => ({ ...prev, step: 'validating' }));

    try {
      // Step 1: Validate recovery code
      const validateResponse = await recoveryService.validateRecoveryCode({
        recoveryCode: state.recoveryCode,
        salt,
      });

      if (!validateResponse.valid) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: validateResponse.error || 'Invalid recovery code',
        }));
        return;
      }

      setState((prev) => ({ ...prev, step: 'recovering' }));

      // Step 2: Recover DEK
      const recoverResponse = await recoveryService.recoverDEK({
        recoveryCode: state.recoveryCode,
        salt,
        encryptedDEK: wrappedDEK.encryptedDEK,
        nonce: wrappedDEK.nonce,
        tag: wrappedDEK.tag,
      });

      if (recoverResponse.success && recoverResponse.dek) {
        setState((prev) => ({ ...prev, step: 'success' }));
        onSuccess(recoverResponse.dek);
      } else {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: recoveryService.getRecoveryErrorMessage(
            recoverResponse.context
          ),
          context: recoverResponse.context,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Recovery failed',
      }));
    }
  };

  const handleRetry = () => {
    setState({
      step: 'input',
      recoveryCode: '',
    });
    setRawInput('');
  };

  const renderStep = () => {
    switch (state.step) {
      case 'input':
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🔑 Enter Recovery Code
            </h3>
            <p className="text-gray-600 mb-6">
              Enter your recovery code to unlock your vault. This code was
              generated when you first set up your vault.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recoveryCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Recovery Code
                </label>
                <input
                  id="recoveryCode"
                  type="text"
                  value={rawInput}
                  onChange={handleRecoveryCodeChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg text-center tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={39} // 32 chars + 7 potential hyphens
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 32-character recovery code. Spaces and hyphens will
                  be handled automatically.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={state.recoveryCode.replace(/-/g, '').length !== 32}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Unlock Vault
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        );

      case 'validating':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Validating Recovery Code
            </h3>
            <p className="text-gray-600">Checking your recovery code...</p>
          </div>
        );

      case 'recovering':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unlocking Vault
            </h3>
            <p className="text-gray-600">Recovering your vault data...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vault Unlocked Successfully!
            </h3>
            <p className="text-gray-600">
              Your vault has been recovered using the recovery code.
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Recovery Failed
            </h3>
            <p className="text-red-600 mb-4">{state.error}</p>

            {/* Detailed error context for debugging */}
            {state.context && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Diagnostic Information:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${state.context.codeFormatValid ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    <span>
                      Code format:{' '}
                      {state.context.codeFormatValid ? 'Valid' : 'Invalid'}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${state.context.saltValid ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    <span>
                      Recovery data:{' '}
                      {state.context.saltValid ? 'Valid' : 'Invalid'}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${state.context.keyDerivationSucceeded ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    <span>
                      Key derivation:{' '}
                      {state.context.keyDerivationSucceeded
                        ? 'Success'
                        : 'Failed'}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${state.context.unwrappingSucceeded ? 'bg-green-500' : 'bg-red-500'}`}
                    ></span>
                    <span>
                      Vault unlock:{' '}
                      {state.context.unwrappingSucceeded ? 'Success' : 'Failed'}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Vault Recovery</h2>
            {state.step === 'input' && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {renderStep()}

          {/* Security Notice */}
          {state.step === 'input' && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Security Notice
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      Recovery codes bypass your master password. Only use this
                      if you have lost access to your master password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
