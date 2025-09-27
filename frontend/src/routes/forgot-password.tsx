import { createFileRoute } from '@tanstack/react-router';

const ForgotPasswordComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Quên mật khẩu
          </h1>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Tính năng khôi phục mật khẩu hiện đang được phát triển.
            Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>

          <div className="space-y-4">
            <a
              href="/login"
              className="btn-primary w-full inline-block"
            >
              Quay lại đăng nhập
            </a>

            <a
              href="/register"
              className="btn-ghost w-full inline-block"
            >
              Tạo tài khoản mới
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordComponent,
});