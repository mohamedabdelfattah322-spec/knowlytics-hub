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
    // ── Brand variations (English) ──
    'Knowlytics Hub', 'knowlytics hub', 'KnowlyticsHub',
    'Knowlytics', 'knowlytics', 'knowlytics hub courses',
    'knowlytics hub lms', 'knowlytics hub egypt',
    'knowlytics hub online', 'knowlyticshub.com',
    'learn.knowlyticshub.com', 'knowlytics hub arabic',
    'knowlitics hub', 'nolytix hub', 'knowletics hub',

    // ── Brand variations (Arabic) ──
    'نولتكس هاب', 'نولتيكس هاب', 'نولتكس', 'نولتيكس',
    'نوليتكس هاب', 'منصة نولتكس', 'موقع نولتكس',
    'كورسات نولتكس', 'نولتكس للتعليم', 'نولتكس هاب مصر',
    'نولتكس هاب للكورسات', 'منصة نولتكس هاب',

    // ── عربي — محتوى ──
    'تحليل البيانات', 'كورس Excel', 'Power BI', 'تعلم البرمجة',
    'منصة تعليمية', 'شهادات معتمدة', 'كورسات أونلاين', 'تعليم عن بعد',
    'أفضل كورسات Excel بالعربي', 'تحليل البيانات بالعربي',
    'كورس تحليل البيانات', 'منصة تعليمية عربية',

    // ── دول عربية ──
    'كورسات مصر', 'كورسات السعودية', 'تعليم الإمارات',
    'كورسات الكويت', 'تعلم قطر', 'كورسات عربية أونلاين',

    // ── English — International ──
    'data analysis course Arabic', 'Excel course Arabic',
    'Power BI Arabic', 'online courses Middle East',
    'data analytics training Arabic', 'certified data analyst course',
    'online learning platform Arabic', 'LMS Arabic',
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
    alternateLocale: ['en_US', 'ar_SA', 'ar_AE', 'ar_KW', 'ar_QA'],
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
    languages: {
      'ar': 'https://learn.knowlyticshub.com',
      'en': 'https://learn.knowlyticshub.com',
      'ar-EG': 'https://learn.knowlyticshub.com',
      'ar-SA': 'https://learn.knowlyticshub.com',
      'ar-AE': 'https://learn.knowlyticshub.com',
      'x-default': 'https://learn.knowlyticshub.com',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/Logo.jpeg',
  },
  verification: {
    google: 'oFkjl6U_wE68ihHU3rmzvo-y9QyVVK-5xqL_C6IZEEg',
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
  alternateName: 'نولتكس هاب',
  url: 'https://learn.knowlyticshub.com',
  logo: 'https://learn.knowlyticshub.com/Logo.jpeg',
  description: 'منصة تعليمية متكاملة لتعلم تحليل البيانات والبرمجة مع شهادات معتمدة — متاحة لجميع الدول العربية',
  foundingLocation: {
    '@type': 'Place',
    name: 'Egypt',
    addressCountry: 'EG',
  },
  areaServed: [
    { '@type': 'Country', name: 'Egypt' },
    { '@type': 'Country', name: 'Saudi Arabia' },
    { '@type': 'Country', name: 'United Arab Emirates' },
    { '@type': 'Country', name: 'Kuwait' },
    { '@type': 'Country', name: 'Qatar' },
    { '@type': 'Country', name: 'Jordan' },
    { '@type': 'Country', name: 'Morocco' },
    { '@type': 'GeoShape', name: 'Worldwide' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+201226929392',
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'English'],
    areaServed: 'Worldwide',
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
  alternateName: [
    'نولتكس هاب', 'نولتيكس هاب', 'KnowlyticsHub',
    'Knowlytics', 'نولتكس', 'knowlytics hub lms',
  ],
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
