'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeName = 'dark' | 'light' | 'ocean' | 'emerald' | 'sunset';

export interface ThemeInfo {
  id: ThemeName;
  label: string;
  labelAr: string;
  preview: string; // CSS gradient for preview swatch
}

export const THEMES: ThemeInfo[] = [
  { id: 'dark',    label: 'Dark',     labelAr: 'داكن',       preview: 'linear-gradient(135deg, #0a1628, #6366f1)' },
  { id: 'light',   label: 'Light',    labelAr: 'فاتح',       preview: 'linear-gradient(135deg, #f8fafc, #6366f1)' },
  { id: 'ocean',   label: 'Ocean',    labelAr: 'محيطي',      preview: 'linear-gradient(135deg, #0c1222, #0ea5e9)' },
  { id: 'emerald', label: 'Emerald',  labelAr: 'زمردي',      preview: 'linear-gradient(135deg, #0a1a14, #10b981)' },
  { id: 'sunset',  label: 'Sunset',   labelAr: 'غروب',       preview: 'linear-gradient(135deg, #1c1012, #f43f5e)' },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState<ThemeName>('dark');

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('kh_theme') as ThemeName | null;
    if (saved && THEMES.find(t => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('kh_theme', t);
  }, []);

  return { theme, setTheme };
}
