'use client';
import Link from 'next/link';
import { Printer, ArrowLeft, Award } from 'lucide-react';

export default function CertificatePreviewPage() {
  const studentName = 'Mohamed Abdelfattah';
  const courseTitle = 'DATA ANALYSIS USING EXCEL-POWER BI-AI';
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
  const serial = 'KH-PREVIEW';
  const founderName = 'Mohamed Abdelfattah';
  const instructorName = 'Ahmed Hassan'; // Preview with different instructor
  const isSameAsFounder = instructorName === founderName;

  // Auto-shrink course title font if too long
  const titleFontSize = courseTitle.length > 30 ? '0.85cqw'
                       : courseTitle.length > 20 ? '1.0cqw'
                       : '1.3cqw';

  return (
    <div className="min-h-screen bg-slate-200 p-4 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link href="/dashboard/admin" className="text-slate-700 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> رجوع
        </Link>
        <button onClick={() => window.print()}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Printer className="w-4 h-4" /> طباعة / حفظ PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none">
        <div className="cert-canvas relative bg-white shadow-2xl print:shadow-none aspect-[1754/1240] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/certificate-template.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          />

          {/* Course title */}
          <div
            className="absolute"
            style={{
              top: '27.5%',
              left: '14%',
              width: '40%',
              height: '3.3%',
              color: '#1e3a5f',
              fontWeight: 700,
              fontSize: titleFontSize,
              letterSpacing: '0.1em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {courseTitle}
          </div>

          {/* Student name */}
          <div
            className="absolute"
            style={{
              top: '50.5%',
              left: '14%',
              width: '40%',
              height: '4%',
              color: '#1e293b',
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '2cqw',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {studentName}
          </div>

          {/* Date */}
          <div
            className="absolute"
            style={{
              top: '54.7%',
              left: '64.1%',
              width: '12.1%',
              height: '4%',
              color: '#475569',
              fontWeight: 500,
              fontSize: '1.05cqw',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {monthYear}
          </div>

          {/* ── Signatures Area ── */}
          {!isSameAsFounder && (
            <>
              {/* Founder signature — LEFT side */}
              <div className="absolute" style={{
                bottom: '10%', left: '10%', width: '30%',
                textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  fontStyle: 'italic', fontWeight: 600, fontSize: '1.3cqw',
                  color: '#1e293b', marginBottom: '0.3cqw',
                }}>
                  {founderName}
                </p>
                <div style={{ width: '60%', height: '1px', backgroundColor: '#cbd5e1', margin: '0 auto 0.3cqw' }} />
                <p style={{ fontSize: '0.75cqw', color: '#64748b', fontWeight: 600 }}>
                  Founder & CEO
                </p>
              </div>

              {/* Instructor signature — RIGHT side */}
              <div className="absolute" style={{
                bottom: '10%', right: '10%', width: '30%',
                textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  fontStyle: 'italic', fontWeight: 600, fontSize: '1.3cqw',
                  color: '#1e293b', marginBottom: '0.3cqw',
                }}>
                  {instructorName}
                </p>
                <div style={{ width: '60%', height: '1px', backgroundColor: '#cbd5e1', margin: '0 auto 0.3cqw' }} />
                <p style={{ fontSize: '0.75cqw', color: '#64748b', fontWeight: 600 }}>
                  Instructor
                </p>
              </div>
            </>
          )}

          {/* Serial */}
          <div className="absolute" style={{
            bottom: '0.5%', right: '0.7%', color: '#94a3b8',
            fontSize: '0.55cqw',
          }}>
            Serial: {serial}
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 print:hidden">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">📄 معاينة تجريبية</p>
              <p>اسم الطالب وعنوان الكورس والتاريخ بيتغيروا تلقائياً لكل شهادة. لو المدرب حد غير الـ Founder بيظهر توقيعين: Founder & CEO على اليسار والـ Instructor على اليمين.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .cert-canvas {
          container-type: inline-size;
        }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white !important; }
          .cert-canvas { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
