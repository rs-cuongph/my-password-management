import { useCallback, useEffect, useRef } from 'react';

export interface UseAccessibilityOptions {
  autoFocus?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  announceToScreenReader?: boolean;
}

export interface AccessibilityHelpers {
  focusFirst: () => void;
  focusLast: () => void;
  announceToScreenReader: (
    message: string,
    priority?: 'polite' | 'assertive'
  ) => void;
  setFocusTrap: (enabled: boolean) => void;
  getFocusableElements: () => NodeListOf<Element>;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'details > summary',
  'audio[controls]',
  'video[controls]',
].join(',');

export const useAccessibility = (
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseAccessibilityOptions = {}
): AccessibilityHelpers => {
  const {
    autoFocus = false,
    trapFocus = false,
    restoreFocus = false,
    announceToScreenReader = false,
  } = options;

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const isTrappingFocus = useRef(false);

  // Store previously focused element for restoration
  useEffect(() => {
    if (restoreFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Auto focus first element if enabled
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        FOCUSABLE_SELECTORS
      ) as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [autoFocus, containerRef]);

  const getFocusableElements = useCallback((): NodeListOf<Element> => {
    if (!containerRef.current) {
      return document.querySelectorAll(FOCUSABLE_SELECTORS);
    }
    return containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
  }, [containerRef]);

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }, [getFocusableElements]);

  const announceToScreenReaderFn = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.setAttribute('class', 'sr-only');
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isTrappingFocus.current || !containerRef.current) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      // Escape key to close modal/trap
      if (event.key === 'Escape') {
        isTrappingFocus.current = false;
        if (restoreFocus && previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      }
    },
    [containerRef, getFocusableElements, restoreFocus]
  );

  const setFocusTrap = useCallback(
    (enabled: boolean) => {
      isTrappingFocus.current = enabled;

      if (enabled) {
        document.addEventListener('keydown', handleKeyDown);
        if (announceToScreenReader) {
          announceToScreenReaderFn('Modal đã mở. Nhấn Escape để đóng.');
        }
      } else {
        document.removeEventListener('keydown', handleKeyDown);
      }
    },
    [handleKeyDown, announceToScreenReader, announceToScreenReaderFn]
  );

  // Focus trap effect
  useEffect(() => {
    if (trapFocus) {
      setFocusTrap(true);
    }

    return () => {
      setFocusTrap(false);
    };
  }, [trapFocus, setFocusTrap]);

  return {
    focusFirst,
    focusLast,
    announceToScreenReader: announceToScreenReaderFn,
    setFocusTrap,
    getFocusableElements,
  };
};

// Screen reader only utility class
export const srOnlyClass =
  'absolute -m-px w-px h-px p-0 border-0 overflow-hidden whitespace-nowrap clip-rect-0';

// Hook for managing roving tabindex (useful for component groups like tabs, menus)
export const useRovingTabindex = (
  containerRef: React.RefObject<HTMLElement | null>,
  activeIndex: number = 0
) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(
      '[role="tab"], [role="menuitem"], [role="option"]'
    );

    items.forEach((item, index) => {
      const element = item as HTMLElement;
      element.tabIndex = index === activeIndex ? 0 : -1;
    });
  }, [containerRef, activeIndex]);

  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent,
      currentIndex: number,
      onIndexChange: (index: number) => void
    ) => {
      if (!containerRef.current) return;

      const items = containerRef.current.querySelectorAll(
        '[role="tab"], [role="menuitem"], [role="option"]'
      );
      const itemCount = items.length;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % itemCount;
          onIndexChange(nextIndex);
          (items[nextIndex] as HTMLElement).focus();
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex =
            currentIndex === 0 ? itemCount - 1 : currentIndex - 1;
          onIndexChange(prevIndex);
          (items[prevIndex] as HTMLElement).focus();
          break;
        }
        case 'Home':
          event.preventDefault();
          onIndexChange(0);
          (items[0] as HTMLElement).focus();
          break;
        case 'End':
          event.preventDefault();
          onIndexChange(itemCount - 1);
          (items[itemCount - 1] as HTMLElement).focus();
          break;
      }
    },
    [containerRef]
  );

  return { handleKeyDown };
};
