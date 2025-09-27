import React, { useState, useMemo } from 'react';
import type { PasswordEntry } from '../utils/vaultCrypto';
import CopyButton from './CopyButton';

interface VaultDashboardProps {
  entries: PasswordEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: PasswordEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyPassword: (password: string) => void;
  isVaultLoaded?: boolean;
}

type SortField = 'site' | 'updatedAt' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  // onCopyPassword - handled by CopyButton component
  isVaultLoaded = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('site');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filter và sort entries
  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(
      (entry) =>
        entry.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.notes &&
          entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.tags &&
          entry.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSiteIcon = (site: string) => {
    const domain = site.toLowerCase();
    if (domain.includes('google')) return '🔍';
    if (domain.includes('facebook') || domain.includes('meta')) return '📘';
    if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
    if (domain.includes('github')) return '🐙';
    if (domain.includes('linkedin')) return '💼';
    if (domain.includes('instagram')) return '📷';
    if (domain.includes('youtube')) return '📺';
    if (domain.includes('netflix')) return '🎬';
    if (domain.includes('spotify')) return '🎵';
    if (domain.includes('amazon')) return '📦';
    return '🌐';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Password Vault
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {entries.length}
            </span>
            mật khẩu được bảo vệ
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title="List view"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title="Grid view"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={onAddEntry}
            disabled={!isVaultLoaded}
            className={`btn-primary flex items-center gap-2 animate-slide-up ${
              !isVaultLoaded ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ animationDelay: '0.1s' }}
            title={!isVaultLoaded ? 'Vault chưa được load' : ''}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Thêm mật khẩu</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {/* Search và Controls */}
      <div
        className="card p-6 mb-8 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên trang web, tài khoản, ghi chú hoặc tags..."
                className="input-primary pl-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-3">
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [
                  SortField,
                  SortDirection,
                ];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="input-primary min-w-0"
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

      {/* Results Summary */}
      {searchTerm && (
        <div className="mb-6 animate-fade-in">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tìm thấy{' '}
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {filteredAndSortedEntries.length}
            </span>{' '}
            kết quả cho
            <span className="font-medium"> "{searchTerm}"</span>
          </p>
        </div>
      )}

      {/* Entries List */}
      {filteredAndSortedEntries.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {searchTerm ? 'Không tìm thấy kết quả' : 'Vault trống'}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả'
              : 'Bắt đầu bằng cách thêm mật khẩu đầu tiên của bạn vào vault bảo mật'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAddEntry}
              disabled={!isVaultLoaded}
              className={`btn-primary flex items-center gap-3 mx-auto ${
                !isVaultLoaded ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!isVaultLoaded ? 'Vault chưa được load' : ''}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm mật khẩu đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="card card-hover p-6 animate-slide-up group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Entry Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {getSiteIcon(entry.site)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {entry.site}
                    </h3>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm flex items-center gap-1 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span className="truncate">Mở trang web</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onEditEntry(entry)}
                    className="btn-ghost p-2"
                    title="Chỉnh sửa"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950 p-2 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Entry Content */}
              <div className="space-y-4">
                {/* Username */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">
                      Tài khoản
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 font-mono truncate">
                      {entry.username}
                    </span>
                  </div>
                  <CopyButton
                    text={entry.username}
                    type="tài khoản"
                    clearTimeout={10}
                    size="sm"
                    variant="ghost"
                  />
                </div>

                {/* Password */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">
                      Mật khẩu
                    </span>
                    <span className="text-sm font-mono text-neutral-900 dark:text-neutral-100 truncate">
                      {visiblePasswords.has(entry.id)
                        ? entry.password
                        : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="btn-ghost p-2"
                      title={
                        visiblePasswords.has(entry.id)
                          ? 'Ẩn mật khẩu'
                          : 'Hiện mật khẩu'
                      }
                    >
                      {visiblePasswords.has(entry.id) ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
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
                </div>

                {/* Additional Info */}
                {(entry.hint || entry.notes) && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    {entry.hint && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">
                          Gợi ý
                        </span>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {entry.hint}
                        </span>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">
                          Ghi chú
                        </span>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {entry.notes}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {formatDate(entry.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {formatDate(entry.updatedAt)}
                  </span>
                  {entry.lastUsed && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDate(entry.lastUsed)}
                    </span>
                  )}
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
