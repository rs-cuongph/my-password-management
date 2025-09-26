import React, { useState, useRef } from 'react';
import { useAccessibility, useRovingTabindex } from '../hooks/useAccessibility';
import { useAppStore } from '../stores/appStore';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import AccessibilitySettings from './AccessibilitySettings';

const AccessibilityDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const demoRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { screenReaderAnnouncements } = useAppStore();

  const { announceToScreenReader } = useAccessibility(demoRef, {
    announceToScreenReader: screenReaderAnnouncements
  });

  const { handleKeyDown } = useRovingTabindex(tabsRef, activeTab);

  const tabs = [
    { id: 'overview', label: 'Tổng quan', content: 'Nội dung tổng quan về accessibility' },
    { id: 'keyboard', label: 'Bàn phím', content: 'Hướng dẫn điều hướng bằng bàn phím' },
    { id: 'screen-reader', label: 'Screen Reader', content: 'Thông tin cho phần mềm đọc màn hình' },
    { id: 'visual', label: 'Thị giác', content: 'Tùy chọn hỗ trợ thị giác' }
  ];

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (screenReaderAnnouncements) {
      announceToScreenReader(`Đã chuyển sang tab ${tabs[index].label}`, 'polite');
    }
  };

  const handleInputValidation = () => {
    if (inputValue.length < 3) {
      setInputError('Phải có ít nhất 3 ký tự');
      if (screenReaderAnnouncements) {
        announceToScreenReader('Lỗi: Phải có ít nhất 3 ký tự', 'assertive');
      }
    } else {
      setInputError('');
      if (screenReaderAnnouncements) {
        announceToScreenReader('Input hợp lệ', 'polite');
      }
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    if (screenReaderAnnouncements) {
      announceToScreenReader('Modal demo đã mở', 'assertive');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (screenReaderAnnouncements) {
      announceToScreenReader('Modal demo đã đóng', 'polite');
    }
  };

  return (
    <div ref={demoRef} className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Demo Accessibility Features
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Trang demo các tính năng accessibility đã được triển khai
        </p>
      </header>

      {/* Settings Section */}
      <section>
        <AccessibilitySettings />
      </section>

      {/* Button Demo */}
      <section className="card p-6" role="region" aria-labelledby="button-demo-heading">
        <h2 id="button-demo-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Demo Buttons
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">
            Primary Button
          </Button>
          <Button variant="secondary">
            Secondary Button
          </Button>
          <Button variant="danger">
            Danger Button
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
          <Button variant="primary" loading loadingText="Đang tải...">
            Loading Button
          </Button>
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            With Icon
          </Button>
        </div>
      </section>

      {/* Input Demo */}
      <section className="card p-6" role="region" aria-labelledby="input-demo-heading">
        <h2 id="input-demo-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Demo Inputs
        </h2>
        <div className="space-y-4 max-w-md">
          <Input
            label="Email"
            type="email"
            placeholder="Nhập email của bạn"
            helperText="Chúng tôi sẽ không chia sẻ email của bạn"
            required
          />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu"
            required
          />
          <Input
            label="Test Input với validation"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputValidation}
            error={inputError}
            helperText="Nhập ít nhất 3 ký tự"
            required
          />
        </div>
      </section>

      {/* Tabs Demo */}
      <section className="card p-6" role="region" aria-labelledby="tabs-demo-heading">
        <h2 id="tabs-demo-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Demo Tabs với Roving Tabindex
        </h2>

        <div ref={tabsRef}>
          {/* Tab List */}
          <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4" role="tablist" aria-labelledby="tabs-demo-heading">
            <div className="flex space-x-8">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === index}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === index ? 0 : -1}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${activeTab === index
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    }
                  `}
                  onClick={() => handleTabChange(index)}
                  onKeyDown={(e) => handleKeyDown(e, index, handleTabChange)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Panels */}
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              id={`tabpanel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              className={activeTab === index ? 'block' : 'hidden'}
              tabIndex={0}
            >
              <p className="text-neutral-600 dark:text-neutral-400">
                {tab.content}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Demo */}
      <section className="card p-6" role="region" aria-labelledby="modal-demo-heading">
        <h2 id="modal-demo-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Demo Modal với Focus Trap
        </h2>
        <Button onClick={openModal}>
          Mở Modal Demo
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Modal Demo"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              Đây là modal demo với focus trap. Hãy thử:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>Nhấn Tab để di chuyển qua các element</li>
              <li>Focus sẽ bị "trap" trong modal này</li>
              <li>Nhấn Escape để đóng modal</li>
              <li>Focus sẽ trở về button đã mở modal</li>
            </ul>

            <div className="flex space-x-4">
              <Button variant="primary">
                Button 1
              </Button>
              <Button variant="secondary">
                Button 2
              </Button>
              <Button variant="ghost" onClick={closeModal}>
                Đóng Modal
              </Button>
            </div>
          </div>
        </Modal>
      </section>

      {/* Keyboard Shortcuts Info */}
      <section className="card p-6" role="region" aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Phím tắt hỗ trợ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Điều hướng cơ bản</h3>
            <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Tab</kbd> - Phần tử tiếp theo</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Shift+Tab</kbd> - Phần tử trước</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Enter</kbd> - Kích hoạt</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Space</kbd> - Kích hoạt button</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Thao tác nâng cao</h3>
            <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Escape</kbd> - Đóng modal</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Arrow Keys</kbd> - Điều hướng tabs</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Home</kbd> - Tab đầu tiên</li>
              <li><kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">End</kbd> - Tab cuối cùng</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Screen Reader Status */}
      <section className="card p-6 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Thông báo Screen Reader
        </h2>
        <p className="text-sm text-primary-800 dark:text-primary-200">
          {screenReaderAnnouncements
            ? 'Đang bật - Các thông báo sẽ được đọc tự động'
            : 'Đang tắt - Các thông báo sẽ không được đọc'
          }
        </p>
      </section>
    </div>
  );
};

export default AccessibilityDemo;