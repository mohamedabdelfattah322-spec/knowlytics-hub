import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowlytics Hub — Smart Learning Platform',
  description: 'Hybrid LMS supporting live courses, recorded content, and interactive quizzes.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <WhatsAppFloat />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#f8fafc' } },
          }}
        />
      </body>
    </html>
  );
}
