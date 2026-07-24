'use client';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  const toggle = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-t-secondary hover:text-t-primary hover:bg-dark-700 w-full transition-all duration-200"
    >
      <Globe className="w-4 h-4" />
      <span className="flex-1 text-start">{locale === 'ar' ? 'English' : 'عربي'}</span>
      <span className="text-xs text-t-muted bg-dark-700 px-2 py-0.5 rounded">{locale === 'ar' ? 'AR' : 'EN'}</span>
    </button>
  );
}
