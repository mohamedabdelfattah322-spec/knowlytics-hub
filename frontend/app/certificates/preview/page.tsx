'use client';
import Link from 'next/link';
import { Printer, ArrowLeft, Award } from 'lucide-react';

export default function CertificatePreviewPage() {
  const studentName = 'Muhammed Hesham Elrawashdy';
  const courseTitle = 'DATA ANALYSIS TOOLS';
  const courseTitleUpper = courseTitle.toUpperCase();
  const monthYear = 'April-2026';
  const serial = 'KH-PREVIEW';
  const founderName = 'Mohamed Abdelfattah';
  const instructorName = 'Ahmed Hassan';
  const durationHours = 39;

  const titleFontSize = courseTitleUpper.length > 40 ? '1.1cqw'
                       : courseTitleUpper.length > 25 ? '1.4cqw'
                       : '1.7cqw';

  const nameFontSize = studentName.length > 30 ? '1.8cqw'
                     : studentName.length > 20 ? '2.2cqw'
                     : '2.6cqw';

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
        <div className="cert-canvas relative bg-white shadow-2xl print:shadow-none aspect-[3508/2481] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/certificate-template.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          />

          {/* Course title — above "Certificate" */}
          <div
            className="absolute"
            style={{
              top: '16.5%', left: '5%', width: '50%', height: '4%',
              color: '#1e3a5f', fontWeight: 700, fontSize: titleFontSize,
              letterSpacing: '0.15em', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center',
            }}
          >
            {courseTitleUpper}
          </div>

          {/* Student name — after "THIS CERTIFICATE IS PRESENTED TO" */}
          <div
            className="absolute"
            style={{
              top: '46%', left: '5%', width: '55%', height: '6%',
              color: '#1e293b',
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700, fontSize: nameFontSize,
              lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden',
              display: 'flex', alignItems: 'center',
            }}
          >
            {studentName}
          </div>

          {/* Course name — after "For the successful completion of the course" */}
          <div
            className="absolute"
            style={{
              top: '55%', left: '5%', width: '55%', height: '3.5%',
              color: '#1e3a5f', fontWeight: 700, fontSize: '1.2cqw',
              letterSpacing: '0.08em', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center',
            }}
          >
            {courseTitleUpper}
          </div>

          {/* Duration hours */}
          <div
            className="absolute"
            style={{
              top: '64%', left: '5%', width: '55%', height: '4%',
              color: '#1e3a5f', fontWeight: 600, fontSize: '1.3cqw',
              lineHeight: 1,
              display: 'flex', alignItems: 'center',
            }}
          >
            {durationHours}H
          </div>

          {/* Date — center */}
          <div
            className="absolute"
            style={{
              top: '64%', left: '30%', width: '20%', height: '4%',
              color: '#475569', fontWeight: 600, fontSize: '1.3cqw',
              lineHeight: 1, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {monthYear}
          </div>

          {/* ── Founder signature — LEFT side ── */}
          <div className="absolute" style={{
            bottom: '6%', left: '8%', width: '25%',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: '"Dancing Script", "Playfair Display", "Georgia", cursive, serif',
              fontStyle: 'italic', fontWeight: 700, fontSize: '1.4cqw',
              color: '#1e293b', marginBottom: '0.5cqw',
            }}>
              {founderName}
            </p>
            <p style={{ fontSize: '0.8cqw', color: '#64748b', fontWeight: 600 }}>
              Founder
            </p>
          </div>

          {/* ── Instructor signature — RIGHT side ── */}
          <div className="absolute" style={{
            bottom: '6%', right: '8%', width: '25%',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: '"Dancing Script", "Playfair Display", "Georgia", cursive, serif',
              fontStyle: 'italic', fontWeight: 700, fontSize: '1.4cqw',
              color: '#1e293b', marginBottom: '0.5cqw',
            }}>
              {instructorName}
            </p>
            <p style={{ fontSize: '0.8cqw', color: '#64748b', fontWeight: 600 }}>
              Instructor
            </p>
          </div>

          {/* Serial */}
          <div className="absolute" style={{
            bottom: '1%', right: '1%', color: '#94a3b8', fontSize: '0.55cqw',
          }}>
            Serial: {serial}
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 print:hidden">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">📄 معاينة تجريبية</p>
              <p>اسم الطالب وعنوان الكورس والتاريخ بيتغيروا تلقائياً لكل شهادة. لو المدرب حد غير الـ Founder بيظهر توقيعين: Founder على اليسار والـ Instructor على اليمين.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
        .cert-canvas { container-type: inline-size; }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white !important; }
          .cert-canvas { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
