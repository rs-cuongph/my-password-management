import React, { useState, useMemo } from 'react';
import { PasswordEntry } from '../utils/vaultCrypto';
import CopyButton from './CopyButton';

interface VaultDashboardProps {
  entries: PasswordEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: PasswordEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyPassword: (password: string) => void;
}

type SortField = 'site' | 'updatedAt' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onCopyPassword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('site');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Filter và sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries.filter(entry =>
      entry.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case 'site':
          aValue = a.site.toLowerCase();
          bValue = b.site.toLowerCase();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [entries, searchTerm, sortField, sortDirection]);

  const togglePasswordVisibility = (entryId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(entryId)) {
      newVisible.delete(entryId);
    } else {
      newVisible.add(entryId);
    }
    setVisiblePasswords(newVisible);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vault Quản Lý Mật Khẩu</h1>
          <p className="text-gray-600 mt-1">
            {entries.length} mục đã lưu
          </p>
        </div>
        <button
          onClick={onAddEntry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm Mục Mới
        </button>
      </div>

      {/* Search và Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên trang web, tài khoản, ghi chú..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="site-asc">Tên trang web (A-Z)</option>
              <option value="site-desc">Tên trang web (Z-A)</option>
              <option value="updatedAt-desc">Cập nhật gần nhất</option>
              <option value="updatedAt-asc">Cập nhật cũ nhất</option>
              <option value="createdAt-desc">Tạo gần nhất</option>
              <option value="createdAt-asc">Tạo cũ nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {filteredAndSortedEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có mục nào'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'
              : 'Bắt đầu bằng cách thêm mục mật khẩu đầu tiên của bạn'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={onAddEntry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Thêm Mục Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {entry.site}
                      </h3>
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 w-fit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Mở
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Username */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-20">Tài khoản:</span>
                        <span className="text-sm font-medium text-gray-900">{entry.username}</span>
                        <CopyButton
                          text={entry.username}
                          type="tài khoản"
                          clearTimeout={10}
                          size="sm"
                          variant="ghost"
                        />
                      </div>

                      {/* Password */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-20">Mật khẩu:</span>
                        <span className="text-sm font-mono">
                          {visiblePasswords.has(entry.id) ? entry.password : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(entry.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title={visiblePasswords.has(entry.id) ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {visiblePasswords.has(entry.id) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <CopyButton
                          text={entry.password}
                          type="mật khẩu"
                          clearTimeout={15}
                          size="sm"
                          variant="ghost"
                        />
                      </div>

                      {/* Hint */}
                      {entry.hint && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 w-20">Gợi ý:</span>
                          <span className="text-sm text-gray-700">{entry.hint}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {entry.notes && (
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-500 w-20">Ghi chú:</span>
                          <span className="text-sm text-gray-700">{entry.notes}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 w-20">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                        <span>Tạo: {formatDate(entry.createdAt)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Cập nhật: {formatDate(entry.updatedAt)}</span>
                        {entry.lastUsed && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>Dùng lần cuối: {formatDate(entry.lastUsed)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-col lg:items-stretch">
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="flex-1 lg:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="flex-1 lg:flex-none bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultDashboard;