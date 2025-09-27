import React from 'react';

interface KDFProgressIndicatorProps {
  progress: number;
  className?: string;
}

export const KDFProgressIndicator: React.FC<KDFProgressIndicatorProps> = ({
  progress,
  className = '',
}) => {
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressText = (progress: number) => {
    if (progress < 20) return 'Khởi tạo...';
    if (progress < 40) return 'Tạo salt...';
    if (progress < 60) return 'Tính toán hash...';
    if (progress < 80) return 'Derive key...';
    if (progress < 95) return 'Hoàn thiện...';
    return 'Hoàn thành!';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getProgressColor(progress)}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
        </div>
      </div>

      {/* Progress Text */}
      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {getProgressText(progress)}
        </span>
        <span className="text-sm font-bold text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Security Info */}
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>🔐 PBKDF2-SHA256</span>
          <span>100,000 iterations</span>
        </div>
        <div className="flex items-center justify-between">
          <span>🛡️ Salt: 256-bit</span>
          <span>Key: 256-bit</span>
        </div>
      </div>

      {/* Animated Security Icons */}
      <div className="mt-2 flex justify-center space-x-2">
        <div className="animate-spin">
          <svg
            className="w-4 h-4 text-indigo-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="animate-bounce">
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="animate-pulse">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default KDFProgressIndicator;
