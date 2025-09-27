import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return '';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'skeleton-wave';
      case 'none':
        return '';
      case 'pulse':
      default:
        return 'animate-pulse';
    }
  };

  const styles = {
    width: width
      ? typeof width === 'number'
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : undefined,
  };

  return (
    <div
      className={`
        bg-neutral-200 dark:bg-neutral-700
        ${getVariantClasses()}
        ${getAnimationClasses()}
        ${className}
      `}
      style={styles}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  width?: string;
}> = ({ lines = 1, className = '', width = '100%' }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height="1rem"
          width={index === lines - 1 ? '75%' : width}
          className={`mb-2 ${index === lines - 1 ? 'mb-0' : ''}`}
        />
      ))}
    </div>
  );
};

export const SkeletonTitle: React.FC<{
  className?: string;
  width?: string;
}> = ({ className = '', width = '60%' }) => {
  return (
    <Skeleton
      variant="text"
      height="1.5rem"
      width={width}
      className={`mb-3 ${className}`}
    />
  );
};

export const SkeletonButton: React.FC<{
  className?: string;
  width?: string | number;
  height?: string | number;
}> = ({ className = '', width = 100, height = 40 }) => {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
    />
  );
};

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = '' }) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
}> = ({ className = '', showHeader = true, showFooter = false, lines = 3 }) => {
  return (
    <div
      className={`p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl ${className}`}
    >
      {showHeader && (
        <div className="mb-4">
          <SkeletonTitle width="40%" />
          <SkeletonText lines={1} width="80%" />
        </div>
      )}

      <div className="space-y-3">
        <SkeletonText lines={lines} />
      </div>

      {showFooter && (
        <div className="mt-6 flex gap-3">
          <SkeletonButton width={80} />
          <SkeletonButton width={100} />
        </div>
      )}
    </div>
  );
};

export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
  showAvatar?: boolean;
}> = ({ items = 5, className = '', showAvatar = false }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
        >
          {showAvatar && <SkeletonAvatar />}
          <div className="flex-1">
            <SkeletonTitle width="30%" />
            <SkeletonText lines={2} />
          </div>
          <SkeletonButton width={60} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div
      className={`border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height="1rem" width="80%" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height="1rem" width="90%" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Specialized loading screens for different pages
export const VaultLoadingSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonTitle width="200px" />
          <SkeletonText lines={1} width="300px" />
        </div>
        <div className="flex gap-3">
          <SkeletonButton width={120} />
          <SkeletonButton width={100} />
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <Skeleton height="40px" className="flex-1" variant="rounded" />
        <SkeletonButton width={80} />
        <SkeletonButton width={60} />
      </div>

      {/* Vault entries */}
      <SkeletonList items={8} showAvatar />
    </div>
  );
};

export const AuthLoadingSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`max-w-md mx-auto space-y-6 ${className}`}>
      <div className="text-center">
        <SkeletonAvatar size={80} className="mx-auto mb-4" />
        <SkeletonTitle width="60%" className="mx-auto" />
        <SkeletonText lines={2} className="mx-auto" width="80%" />
      </div>

      <div className="space-y-4">
        <div>
          <Skeleton height="1rem" width="25%" className="mb-2" />
          <Skeleton height="48px" variant="rounded" />
        </div>
        <div>
          <Skeleton height="1rem" width="30%" className="mb-2" />
          <Skeleton height="48px" variant="rounded" />
        </div>
        <SkeletonButton height={48} className="w-full" />
      </div>

      <div className="text-center space-y-2">
        <SkeletonText lines={1} width="50%" className="mx-auto" />
        <SkeletonText lines={1} width="40%" className="mx-auto" />
      </div>
    </div>
  );
};

export const SettingsLoadingSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`space-y-8 ${className}`}>
      <SkeletonTitle width="200px" />

      {/* Settings sections */}
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard
          key={index}
          showHeader
          showFooter
          lines={2}
          className="p-6"
        />
      ))}
    </div>
  );
};

// Loading screen wrapper with fade-in animation
export const LoadingScreen: React.FC<{
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}> = ({ children, className = '', fullScreen = false }) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center'
    : '';

  return (
    <div className={`animate-fade-in ${containerClasses} ${className}`}>
      {fullScreen ? (
        <div className="w-full max-w-4xl px-6">{children}</div>
      ) : (
        children
      )}
    </div>
  );
};

export default Skeleton;
