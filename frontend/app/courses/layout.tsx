import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الكورسات | كورسات تحليل البيانات وExcel وPower BI',
  description: 'تصفح مكتبة كورسات Knowlytics Hub. تعلم تحليل البيانات، Excel المتقدم، Power BI، Python وأكثر. كورسات أونلاين ومباشرة بشهادات معتمدة.',
  keywords: ['كورسات تحليل البيانات', 'كورس Excel', 'Power BI عربي', 'تعلم Python', 'كورسات أونلاين'],
  openGraph: {
    title: 'كورسات Knowlytics Hub | تحليل البيانات والبرمجة',
    description: 'أكثر من 10 كورسات في تحليل البيانات والبرمجة. ابدأ رحلتك التعليمية اليوم.',
    url: 'https://learn.knowlyticshub.com/courses',
  },
  alternates: {
    canonical: 'https://learn.knowlyticshub.com/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
