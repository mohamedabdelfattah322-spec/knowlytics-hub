'use client';
import { ReactNode } from 'react';
import { LanguageContext, useLanguageProvider } from '@/hooks/useLanguage';

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useLanguageProvider();
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
