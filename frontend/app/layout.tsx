import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ThemeProvider from '@/components/ThemeProvider';
import LanguageProvider from '@/components/LanguageProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://learn.knowlyticshub.com'),
  title: {
    default: 'Knowlytics Hub | منصة تعليمية لتحليل البيانات',
    template: '%s | Knowlytics Hub',
  },
  description: 'منصة تعليمية متكاملة لتعلم تحليل البيانات، Excel، Power BI، والبرمجة. كورسات أونلاين ومباشرة مع شهادات معتمدة. ابدأ رحلتك التعليمية اليوم.',
  keywords: [
    'تحليل البيانات', 'كورس Excel', 'Power BI', 'تعلم البرمجة',
    'منصة تعليمية', 'شهادات معتمدة', 'كورسات أونلاين',
    'Knowlytics Hub', 'data analysis course', 'online learning Arabic',
    'LMS عربي', 'تعليم عن بعد',
  ],
  authors: [{ name: 'Knowlytics Hub', url: 'https://knowlyticshub.com' }],
  creator: 'Knowlytics Hub',
  publisher: 'Knowlytics Hub',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    url: 'https://learn.knowlyticshub.com',
    siteName: 'Knowlytics Hub',
    title: 'Knowlytics Hub | منصة تعليمية لتحليل البيانات',
    description: 'تعلم تحليل البيانات، Excel، وPower BI مع شهادات معتمدة. انضم لأكثر من 1000 متدرب.',
    images: [
      {
        url: '/Logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Knowlytics Hub - منصة تعليمية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Knowlytics Hub | منصة تعليمية لتحليل البيانات',
    description: 'تعلم تحليل البيانات مع شهادات معتمدة',
    images: ['/Logo.jpeg'],
  },
  alternates: {
    canonical: 'https://learn.knowlyticshub.com',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/Logo.jpeg',
  },
  verification: {
    google: '', // هنحط الـ code هنا بعدين
  },
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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Knowlytics Hub',
  url: 'https://learn.knowlyticshub.com',
  logo: 'https://learn.knowlyticshub.com/Logo.jpeg',
  description: 'منصة تعليمية متكاملة لتعلم تحليل البيانات والبرمجة مع شهادات معتمدة',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+201226929392',
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'English'],
  },
  sameAs: [
    'https://knowlyticshub.com',
    'https://github.com/mohamedabdelfattah322-spec/knowlytics-hub',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Knowlytics Hub',
  url: 'https://learn.knowlyticshub.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://learn.knowlyticshub.com/courses?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
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
