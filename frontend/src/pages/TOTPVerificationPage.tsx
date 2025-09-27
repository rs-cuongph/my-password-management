import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import * as v from 'valibot';
import {
  TOTPVerificationSchema,
  type TOTPVerificationInput,
} from '../schemas/auth';
import { useVerifyTOTP } from '../services/authService';

interface TOTPVerificationPageProps {
  tempToken: string;
}

const TOTPVerificationPage: React.FC<TOTPVerificationPageProps> = ({
  tempToken,
}) => {
  const [formData, setFormData] = useState<TOTPVerificationInput>({
    tempToken,
    totpCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const verifyTOTPMutation = useVerifyTOTP();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Only allow numeric input for TOTP code
    if (name === 'totpCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      v.parse(TOTPVerificationSchema, formData);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    verifyTOTPMutation.mutate(formData, {
      onSuccess: () => {
        // Redirect to dashboard or home page
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác thực 2FA
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="totpCode"
              className="block text-sm font-medium text-gray-700"
            >
              Mã xác thực
            </label>
            <input
              id="totpCode"
              name="totpCode"
              type="text"
              maxLength={6}
              required
              value={formData.totpCode}
              onChange={handleInputChange}
              className={`mt-1 appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl tracking-widest font-mono ${
                errors.totpCode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="000000"
              autoComplete="one-time-code"
            />
            {errors.totpCode && (
              <p className="mt-1 text-sm text-red-600">{errors.totpCode}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 text-center">
              Mã sẽ thay đổi sau mỗi 30 giây
            </p>
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
              disabled={
                verifyTOTPMutation.isPending || formData.totpCode.length !== 6
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyTOTPMutation.isPending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xác thực...
                </div>
              ) : (
                'Xác thực'
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Cần trợ giúp?
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Đảm bảo thời gian trên thiết bị của bạn chính xác</p>
              <p>• Mã sẽ tự động làm mới sau mỗi 30 giây</p>
              <p>• Nếu bạn mất thiết bị xác thực, hãy liên hệ hỗ trợ</p>
            </div>
          </div>

          {/* Alternative Actions */}
          <div className="text-center space-y-2">
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-500 block"
            >
              Quay lại đăng nhập
            </Link>
            <Link
              to="/support"
              className="text-sm text-gray-600 hover:text-gray-500 block"
            >
              Cần hỗ trợ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TOTPVerificationPage;
