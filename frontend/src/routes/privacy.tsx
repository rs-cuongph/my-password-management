import { createFileRoute } from '@tanstack/react-router';

const PrivacyComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Chính sách bảo mật
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                1. Thông tin chúng tôi thu thập
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                Chúng tôi chỉ thu thập thông tin tối thiểu cần thiết để cung cấp dịch vụ:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2">
                <li>Email địa chỉ (để đăng nhập và liên lạc)</li>
                <li>Tên hiển thị</li>
                <li>Dữ liệu vault được mã hóa</li>
                <li>Metadata kỹ thuật (IP, thời gian truy cập)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                2. Mã hóa End-to-End
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Tất cả dữ liệu nhạy cảm của bạn được mã hóa bằng master password trước khi rời khỏi thiết bị.
                Chúng tôi không bao giờ có thể truy cập vào dữ liệu thực của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                3. Zero-Knowledge Architecture
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Kiến trúc zero-knowledge có nghĩa là ngay cả nhân viên của chúng tôi cũng không thể xem được
                mật khẩu hoặc dữ liệu cá nhân của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                4. Lưu trữ dữ liệu
              </h2>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2">
                <li>Dữ liệu được lưu trữ trên máy chủ an toàn với mã hóa AES-256</li>
                <li>Sao lưu được thực hiện định kỳ và cũng được mã hóa</li>
                <li>Chúng tôi không bán hoặc chia sẻ dữ liệu với bên thứ ba</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                5. Quyền của bạn
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                Bạn có quyền:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2">
                <li>Truy cập và tải xuống dữ liệu của mình</li>
                <li>Xóa tài khoản và tất cả dữ liệu liên quan</li>
                <li>Yêu cầu sửa đổi thông tin cá nhân</li>
                <li>Nhận thông báo về các vi phạm bảo mật</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                6. Bảo mật
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn công nghiệp bao gồm HTTPS,
                mã hóa dữ liệu, và kiểm tra bảo mật định kỳ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                7. Liên hệ
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300">
                Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua
                trang hỗ trợ.
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

export const Route = createFileRoute('/privacy')({
  component: PrivacyComponent,
});