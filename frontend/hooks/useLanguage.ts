'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { t as translate, type Locale, type TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
  isAr: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  locale: 'ar',
  setLocale: () => {},
  t: (key) => key,
  dir: 'rtl',
  isAr: true,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useLanguageProvider() {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('kh_locale') as Locale | null;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLocaleState(saved);
      document.documentElement.setAttribute('lang', saved);
      document.documentElement.setAttribute('dir', saved === 'ar' ? 'rtl' : 'ltr');
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('kh_locale', l);
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(key, locale),
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    dir: (locale === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    isAr: locale === 'ar',
  };
}
