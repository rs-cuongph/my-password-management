import React, { forwardRef, useId } from 'react';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'primary' | 'error';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'primary',
      size = 'md',
      fullWidth = true,
      className = '',
      required,
      id,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    const baseClasses = [
      'border rounded-xl transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder-neutral-500 dark:placeholder-neutral-400',
    ];

    const variantClasses = {
      primary: [
        'border-neutral-300 dark:border-neutral-600',
        'bg-white dark:bg-neutral-800',
        'text-neutral-900 dark:text-neutral-100',
        'focus:ring-primary-500 dark:focus:ring-primary-400',
      ],
      error: [
        'border-error-500 dark:border-error-400',
        'bg-white dark:bg-neutral-800',
        'text-neutral-900 dark:text-neutral-100',
        'focus:ring-error-500 dark:focus:ring-error-400',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const inputVariant = hasError ? 'error' : variant;

    const inputClasses = [
      ...baseClasses,
      ...variantClasses[inputVariant],
      sizeClasses[size],
      widthClasses,
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const labelClasses = [
      'block text-sm font-medium mb-1',
      hasError
        ? 'text-error-700 dark:text-error-300'
        : 'text-neutral-700 dark:text-neutral-300',
    ].join(' ');

    const containerClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="bắt buộc">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span
                className="text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              >
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={
              [error ? errorId : '', helperText ? helperId : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            required={required}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span
                className="text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              >
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-error-600 dark:text-error-400"
            role="alert"
          >
            <span className="sr-only">Lỗi: </span>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-sm text-neutral-500 dark:text-neutral-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
