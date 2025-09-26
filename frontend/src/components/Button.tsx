import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-xl',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'dark:focus:ring-offset-neutral-900',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'transform hover:scale-105 active:scale-95',
    'disabled:hover:scale-100 disabled:active:scale-100'
  ];

  const variantClasses = {
    primary: [
      'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
      'dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700',
      'text-white',
      'focus:ring-primary-500'
    ],
    secondary: [
      'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300',
      'dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600',
      'text-neutral-900 dark:text-neutral-100',
      'focus:ring-neutral-500'
    ],
    danger: [
      'bg-error-600 hover:bg-error-700 active:bg-error-800',
      'dark:bg-error-500 dark:hover:bg-error-600 dark:active:bg-error-700',
      'text-white',
      'focus:ring-error-500'
    ],
    ghost: [
      'bg-transparent hover:bg-neutral-100 active:bg-neutral-200',
      'dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
      'text-neutral-700 dark:text-neutral-300',
      'focus:ring-neutral-500'
    ]
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = [
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const renderIcon = (icon: React.ReactNode) => {
    if (!icon) return null;
    return (
      <span className="flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
    );
  };

  const renderLoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const buttonContent = () => {
    if (loading) {
      return (
        <>
          {renderLoadingSpinner()}
          {loadingText && (
            <span className="ml-2">
              {loadingText}
            </span>
          )}
          {!loadingText && (
            <span className="sr-only">Đang tải...</span>
          )}
        </>
      );
    }

    return (
      <>
        {leftIcon && (
          <span className={`${children ? 'mr-2' : ''}`}>
            {renderIcon(leftIcon)}
          </span>
        )}
        {children && <span>{children}</span>}
        {rightIcon && (
          <span className={`${children ? 'ml-2' : ''}`}>
            {renderIcon(rightIcon)}
          </span>
        )}
      </>
    );
  };

  return (
    <button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {buttonContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;