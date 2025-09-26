import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Example component để demo cách sử dụng useAuth hook
export const AuthExample: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, checkAuthStatus } = useAuth();

  if (isLoading) {
    return <div>Đang kiểm tra authentication...</div>;
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-bold mb-2">Auth Status</h3>

      <div className="space-y-2">
        <p>
          <strong>Trạng thái:</strong>{' '}
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
          </span>
        </p>

        {user && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={checkAuthStatus}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Kiểm tra Auth
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};