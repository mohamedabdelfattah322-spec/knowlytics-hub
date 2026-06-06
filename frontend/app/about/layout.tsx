import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن | Knowlytics Hub',
  description: 'تعرف على Knowlytics Hub — منصة تعليمية متخصصة في تحليل البيانات والبرمجة. مدربون خبراء، محتوى عالي الجودة، وشهادات معتمدة.',
  openGraph: {
    title: 'من نحن | Knowlytics Hub',
    description: 'منصة تعليمية متخصصة في تحليل البيانات مع مدربين خبراء وشهادات معتمدة.',
    url: 'https://learn.knowlyticshub.com/about',
  },
  alternates: { canonical: 'https://learn.knowlyticshub.com/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
