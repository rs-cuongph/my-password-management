import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';

export const useI18n = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  // Sync i18n language with app store
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  // Update app store when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (lng !== language) {
        setLanguage(lng as 'vi' | 'en');
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, language, setLanguage]);

  return {
    language,
    setLanguage,
    t: i18n.t,
  };
};
