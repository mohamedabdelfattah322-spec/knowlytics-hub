import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ThemeProvider from '@/components/ThemeProvider';
import LanguageProvider from '@/components/LanguageProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowlytics Hub — Smart Learning Platform',
  description: 'Hybrid LMS supporting live courses, recorded content, and interactive quizzes.',
  icons: { icon: '/favicon.ico' },
};

// Inline script to set theme + language before paint (prevents flash)
const initScript = `
(function(){
  try {
    var t = localStorage.getItem('kh_theme');
    if (t && ['dark','light','ocean','emerald','sunset'].includes(t)) {
      document.documentElement.setAttribute('data-theme', t);
    }
    var l = localStorage.getItem('kh_locale');
    if (l === 'en') {
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
    } else {
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <WhatsAppFloat />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--toast-border)',
                },
                success: { iconTheme: { primary: 'var(--color-brand-500)', secondary: 'var(--color-text-primary)' } },
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
