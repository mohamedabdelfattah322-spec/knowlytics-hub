'use client';
import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, ThemeName } from '@/hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-t-secondary hover:text-t-primary hover:bg-dark-700 w-full transition-all duration-200"
      >
        <Palette className="w-4 h-4" />
        المظهر
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Theme picker popup */}
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl p-3 z-50 animate-fade-in">
            <p className="text-xs font-semibold text-t-muted mb-2 px-1">اختر المظهر</p>
            <div className="space-y-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                    theme === t.id
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                      : 'text-t-secondary hover:bg-dark-700 hover:text-t-primary'
                  }`}
                >
                  {/* Color swatch */}
                  <div
                    className="w-5 h-5 rounded-full border border-dark-600 flex-shrink-0"
                    style={{ background: t.preview }}
                  />
                  <span className="flex-1 text-right">{t.labelAr}</span>
                  {theme === t.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
