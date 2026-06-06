import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تواصل معنا | Knowlytics Hub',
  description: 'تواصل مع فريق Knowlytics Hub. نحن هنا للإجابة على أسئلتك حول الكورسات والتسجيل والدفع.',
  openGraph: {
    title: 'تواصل معنا | Knowlytics Hub',
    url: 'https://learn.knowlyticshub.com/contact',
  },
  alternates: { canonical: 'https://learn.knowlyticshub.com/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
