import { createFileRoute } from '@tanstack/react-router';

const SupportComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-primary-100 dark:from-blue-900 dark:to-primary-900 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5zm0 0v2.25m0 15v2.25M21.75 12h-2.25M4.5 12H2.25"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Trung tâm hỗ trợ
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn sử dụng dịch vụ một cách tốt nhất
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Hướng dẫn sử dụng
                </h3>
              </div>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Tài liệu chi tiết về cách sử dụng các tính năng của ứng dụng quản lý mật khẩu.
              </p>
              <button className="btn-primary bg-green-600 hover:bg-green-700 border-green-600">
                Xem hướng dẫn
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-primary-50 dark:from-blue-950 dark:to-primary-950 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Câu hỏi thường gặp
                </h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Tìm câu trả lời nhanh cho những câu hỏi phổ biến nhất.
              </p>
              <button className="btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600">
                Xem FAQ
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-xl border border-amber-200 dark:border-amber-800 p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Báo cáo sự cố bảo mật
              </h3>
            </div>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              Nếu bạn phát hiện lỗ hổng bảo mật hoặc có mối quan ngại về an ninh, vui lòng liên hệ ngay với chúng tôi.
            </p>
            <button className="btn-primary bg-amber-600 hover:bg-amber-700 border-amber-600">
              Báo cáo ngay
            </button>
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Vẫn cần hỗ trợ?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Nhóm hỗ trợ của chúng tôi sẵn sàng giúp đỡ bạn 24/7
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Gửi yêu cầu hỗ trợ
              </button>
              <button className="btn-ghost">
                Chat trực tuyến
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <a
              href="/"
              className="btn-ghost"
            >
              Quay lại trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/support')({
  component: SupportComponent,
});