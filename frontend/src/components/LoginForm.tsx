import React, { useState, useRef } from 'react';
import * as v from 'valibot';
import { Loader2 } from 'lucide-react';
import { LoginSchema, type LoginInput } from '../schemas/auth';
import { useLogin } from '../services/authService';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAppStore } from '../stores/appStore';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { screenReaderAnnouncements } = useAppStore();

  const { announceToScreenReader } = useAccessibility(formRef, {
    announceToScreenReader: screenReaderAnnouncements,
  });

  const loginMutation = useLogin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      v.parse(LoginSchema, formData);
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

        // Announce validation errors to screen reader
        if (screenReaderAnnouncements) {
          const errorMessages = Object.values(fieldErrors);
          if (errorMessages.length > 0) {
            announceToScreenReader(
              `Có ${errorMessages.length} lỗi trong form: ${errorMessages.join(', ')}`,
              'assertive'
            );
          }
        }
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(formData, {
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng thử lại.';
        setErrors({ general: errorMessage });

        if (screenReaderAnnouncements) {
          announceToScreenReader(`Lỗi đăng nhập: ${errorMessage}`, 'assertive');
        }
      },
      onSuccess: () => {
        if (screenReaderAnnouncements) {
          announceToScreenReader('Đăng nhập thành công', 'polite');
        }
      },
    });
  };

  return (
    <section
      className="max-w-md mx-auto card p-6"
      role="main"
      aria-labelledby="login-heading"
    >
      <h1
        id="login-heading"
        className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-6"
      >
        Đăng Nhập
      </h1>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
          >
            Email{' '}
            <span className="text-error-500" aria-label="bắt buộc">
              *
            </span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`input-primary ${errors.email ? 'input-error' : ''}`}
            placeholder="Nhập email của bạn"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1 text-sm text-error-600 dark:text-error-400"
              role="alert"
            >
              <span className="sr-only">Lỗi: </span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
          >
            Mật khẩu{' '}
            <span className="text-error-500" aria-label="bắt buộc">
              *
            </span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className={`input-primary ${errors.password ? 'input-error' : ''}`}
            placeholder="Nhập mật khẩu"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1 text-sm text-error-600 dark:text-error-400"
              role="alert"
            >
              <span className="sr-only">Lỗi: </span>
              {errors.password}
            </p>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div
            className="bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-xl p-3"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-error-600 dark:text-error-400">
              <span className="sr-only">Lỗi: </span>
              {errors.general}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby={
            loginMutation.isPending ? 'loading-status' : undefined
          }
        >
          {loginMutation.isPending ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" />
              <span id="loading-status">Đang đăng nhập...</span>
            </div>
          ) : (
            'Đăng Nhập'
          )}
        </button>
      </form>

      <footer className="mt-6 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:underline"
            aria-describedby="signup-help"
          >
            Đăng ký ngay
          </button>
        </p>
        <span id="signup-help" className="sr-only">
          Chuyển đến trang đăng ký tài khoản mới
        </span>
      </footer>
    </section>
  );
};

export default LoginForm;
