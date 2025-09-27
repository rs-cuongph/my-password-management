import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAppStore } from '../stores/appStore';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { screenReaderAnnouncements } = useAppStore();

  const { announceToScreenReader } = useAccessibility(modalRef, {
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
    announceToScreenReader: screenReaderAnnouncements,
  });

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (screenReaderAnnouncements) {
        announceToScreenReader(`Modal ${title} đã mở`, 'assertive');
      }

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, announceToScreenReader, screenReaderAnnouncements, title]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-content"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${getSizeClasses()} transform rounded-2xl
          bg-white dark:bg-neutral-900
          shadow-xl transition-all
          ${className}
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 ${contentClassName}`}
        >
          <h2
            id="modal-title"
            className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {title}
          </h2>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg p-2 text-neutral-400 hover:text-neutral-600
                dark:text-neutral-500 dark:hover:text-neutral-300
                hover:bg-neutral-100 dark:hover:bg-neutral-800
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-colors
              "
              aria-label="Đóng modal"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div id="modal-content" className={`p-6 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
