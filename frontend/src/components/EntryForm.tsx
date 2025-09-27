import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit3,
  Plus,
  X,
  AlertCircle,
  Link,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Lightbulb,
  Check,
} from 'lucide-react';
import type { PasswordEntry } from '../utils/vaultCrypto';
import CopyButton from './CopyButton';

interface EntryFormProps {
  entry?: PasswordEntry; // Undefined khi thêm mới, có giá trị khi edit
  onSave: (
    entryData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  entry,
  onSave,
  onCancel,
  isOpen,
}) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    hint: '',
    url: '',
    notes: '',
    tags: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form khi entry thay đổi
  useEffect(() => {
    if (entry) {
      setFormData({
        site: entry.site,
        username: entry.username,
        password: entry.password,
        hint: entry.hint || '',
        url: entry.url || '',
        notes: entry.notes || '',
        tags: entry.tags || [],
      });
    } else {
      setFormData({
        site: '',
        username: '',
        password: '',
        hint: '',
        url: '',
        notes: '',
        tags: [],
      });
    }
    setErrors({});
    setShowPassword(false);
    setTagInput('');
  }, [entry, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.site.trim()) {
      newErrors.site = t('entryForm.validation.siteRequired');
    }

    if (!formData.username.trim()) {
      newErrors.username = t('entryForm.validation.usernameRequired');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('entryForm.validation.passwordRequired');
    } else if (formData.password.length < 4) {
      newErrors.password = t('entryForm.validation.passwordMinLength');
    }

    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = t('entryForm.validation.urlInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const entryData = {
      ...formData,
      lastUsed: entry?.lastUsed, // Preserve existing lastUsed date
      metadata: entry?.metadata || {},
    };

    onSave(entryData);
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error khi user bắt đầu sửa
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    handleInputChange('password', password);
    setShowPassword(true);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                {entry ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {entry ? t('entryForm.title.edit') : t('entryForm.title.add')}
              </h2>
            </div>
            <button onClick={onCancel} className="btn-ghost p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.site')} *
              </label>
              <input
                type="text"
                value={formData.site}
                onChange={(e) => handleInputChange('site', e.target.value)}
                className={`input-primary ${errors.site ? 'input-error' : ''}`}
                placeholder={t('entryForm.fields.sitePlaceholder')}
                autoFocus
              />
              {errors.site && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.site}
                </p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.url')}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`input-primary pr-12 ${errors.url ? 'input-error' : ''}`}
                  placeholder={t('entryForm.fields.urlPlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Link className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
              {errors.url && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.url}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.username')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username', e.target.value)
                  }
                  className={`input-primary pr-12 ${errors.username ? 'input-error' : ''}`}
                  placeholder={t('entryForm.fields.usernamePlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {formData.username ? (
                    <CopyButton
                      text={formData.username}
                      type={t('entryForm.buttons.copyUsername')}
                      clearTimeout={10}
                      size="sm"
                      variant="ghost"
                    />
                  ) : (
                    <User className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.password')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  className={`input-primary pr-24 font-mono ${errors.password ? 'input-error' : ''}`}
                  placeholder={t('entryForm.fields.passwordPlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-ghost p-2"
                    title={
                      showPassword
                        ? t('entryForm.buttons.hidePassword')
                        : t('entryForm.buttons.showPassword')
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  {formData.password && (
                    <CopyButton
                      text={formData.password}
                      type={t('entryForm.buttons.copyPassword')}
                      clearTimeout={15}
                      size="sm"
                      variant="ghost"
                    />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}

              <button
                type="button"
                onClick={generatePassword}
                className="mt-3 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t('entryForm.actions.generatePassword')}
              </button>
            </div>

            {/* Password Hint */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.hint')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.hint}
                  onChange={(e) => handleInputChange('hint', e.target.value)}
                  className="input-primary pr-12"
                  placeholder={t('entryForm.fields.hintPlaceholder')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Lightbulb className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.tags')}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 input-primary"
                  placeholder={t('entryForm.fields.tagsPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="btn-secondary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm px-3 py-1.5 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('entryForm.fields.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="input-primary resize-none"
                placeholder={t('entryForm.fields.notesPlaceholder')}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 btn-secondary py-3"
              >
                {t('entryForm.actions.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center btn-primary py-3"
              >
                {entry ? (
                  <Check className="w-5 h-5 mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                {entry
                  ? t('entryForm.actions.update')
                  : t('entryForm.actions.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EntryForm;
