import { createFileRoute } from '@tanstack/react-router';

const TermsComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Điều khoản sử dụng
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                1. Chấp nhận điều khoản
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Bằng việc sử dụng dịch vụ quản lý mật khẩu này, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                2. Mô tả dịch vụ
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Dịch vụ này cung cấp khả năng lưu trữ và quản lý mật khẩu một cách bảo mật thông qua mã hóa end-to-end.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                3. Trách nhiệm người dùng
              </h2>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2">
                <li>Bảo mật master password của bạn</li>
                <li>Sử dụng dịch vụ cho mục đích hợp pháp</li>
                <li>Không chia sẻ thông tin đăng nhập với bên thứ ba</li>
                <li>Thông báo ngay lập tức nếu phát hiện bất kỳ hoạt động đáng ngờ nào</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                4. Bảo mật và quyền riêng tư
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Chúng tôi cam kết bảo vệ dữ liệu của bạn thông qua mã hóa mạnh mẽ và không bao giờ có thể truy cập vào mật khẩu chính hoặc dữ liệu vault của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                5. Giới hạn trách nhiệm
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Dịch vụ được cung cấp "như hiện tại" và chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                6. Thay đổi điều khoản
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Chúng tôi có quyền thay đổi các điều khoản này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <a
              href="/register"
              className="btn-primary mr-4"
            >
              Quay lại đăng ký
            </a>
            <a
              href="/"
              className="btn-ghost"
            >
              Trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/terms')({
  component: TermsComponent,
});