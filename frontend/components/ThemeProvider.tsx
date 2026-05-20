'use client';
import { ReactNode } from 'react';
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValue = useThemeProvider();
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}
