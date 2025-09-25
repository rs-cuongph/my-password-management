import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import * as v from 'valibot';
import { TOTPVerificationSchema, type TOTPVerificationInput } from '../schemas/auth';
import { useSetupTOTP, useVerifyTOTP } from '../services/authService';

interface TOTPSetupPageProps {
  tempToken: string;
}

const TOTPSetupPage: React.FC<TOTPSetupPageProps> = ({ tempToken }) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string>('');
  const [verificationData, setVerificationData] = useState<TOTPVerificationInput>({
    tempToken,
    totpCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setupTOTPMutation = useSetupTOTP();
  const verifyTOTPMutation = useVerifyTOTP();

  useEffect(() => {
    // Setup TOTP when component mounts
    setupTOTPMutation.mutate(
      { tempToken },
      {
        onSuccess: (response) => {
          setQrCodeData(response.data.qrCode || '');
          setOtpauthUri(response.data.otpauthUri);
        },
        onError: (error: any) => {
          if (error?.response?.data?.message) {
            setErrors({ general: error.response.data.message });
          } else {
            setErrors({ general: 'Không thể thiết lập xác thực 2FA. Vui lòng thử lại.' });
          }
        },
      }
    );
  }, [tempToken]);

  const handleVerificationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerificationData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateVerificationForm = (): boolean => {
    try {
      v.parse(TOTPVerificationSchema, verificationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof v.ValiError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path) {
            const fieldName = issue.path[0]?.key as string;
            if (fieldName && !fieldErrors[fieldName]) {
              fieldErrors[fieldName] = issue.message;
            }
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateVerificationForm()) {
      return;
    }

    verifyTOTPMutation.mutate(verificationData, {
      onSuccess: () => {
        // Redirect to dashboard or show success message
        window.location.href = '/dashboard';
      },
      onError: (error: any) => {
        if (error?.response?.data?.message) {
          setErrors({ general: error.response.data.message });
        } else {
          setErrors({ general: 'Xác thực thất bại. Vui lòng thử lại.' });
        }
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      alert('Đã sao chép vào clipboard!');
    });
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Thiết lập xác thực 2FA
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Quét mã QR bằng ứng dụng xác thực của bạn
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {setupTOTPMutation.isPending ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : qrCodeData ? (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${qrCodeData}`}
                    alt="QR Code for 2FA setup"
                    className="w-48 h-48 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Manual Entry */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hoặc nhập thủ công:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={otpauthUri}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(otpauthUri)}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 text-sm"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Hướng dẫn:
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Tải ứng dụng xác thực như Google Authenticator, Authy, hoặc Microsoft Authenticator</li>
                    <li>Quét mã QR hoặc nhập mã thủ công</li>
                    <li>Nhấn "Tiếp tục" để xác thực mã</li>
                  </ol>
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => setStep('verify')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600">Không thể tạo mã QR. Vui lòng thử lại.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  Tải lại trang
                </button>
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác thực mã 2FA
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerificationSubmit}>
          <div>
            <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700">
              Mã xác thực
            </label>
            <input
              id="totpCode"
              name="totpCode"
              type="text"
              maxLength={6}
              required
              value={verificationData.totpCode}
              onChange={handleVerificationInputChange}
              className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg tracking-widest ${
                errors.totpCode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="000000"
            />
            {errors.totpCode && (
              <p className="mt-1 text-sm text-red-600">{errors.totpCode}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={verifyTOTPMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyTOTPMutation.isPending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </div>
              ) : (
                'Xác thực'
              )}
            </button>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Quay lại thiết lập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TOTPSetupPage;