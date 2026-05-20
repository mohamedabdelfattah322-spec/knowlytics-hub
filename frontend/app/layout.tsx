import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowlytics Hub — Smart Learning Platform',
  description: 'Hybrid LMS supporting live courses, recorded content, and interactive quizzes.',
  icons: { icon: '/favicon.ico' },
};

// Inline script to set theme before paint (prevents flash)
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('kh_theme');
    if (t && ['dark','light','ocean','emerald','sunset'].includes(t)) {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
