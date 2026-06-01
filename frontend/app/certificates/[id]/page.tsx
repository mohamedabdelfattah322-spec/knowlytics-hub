'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Printer, ArrowLeft, Award } from 'lucide-react';
import api from '@/lib/api';

interface Certificate {
  id: string;
  serial_no: string;
  issued_at: string;
  final_grade: number | null;
  course_title: string;
  student_name: string;
  instructor_name: string | null;
  batch_name: string | null;
  duration_hours: number;
  course_end_date: string | null;
}

export default function CertificatePage() {
  const { id } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/certificates/${id}`)
      .then(({ data }) => setCert(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
    </div>;
  }

  if (!cert) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">Certificate not found</div>;

  const dateForCert = cert.course_end_date ? new Date(cert.course_end_date) : new Date(cert.issued_at);
  const issueDate = new Date(cert.issued_at);
  const monthYear = dateForCert.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
  const courseTitle = cert.course_title.toUpperCase();
  const titleFontSize = courseTitle.length > 40 ? '1.1cqw'
                       : courseTitle.length > 25 ? '1.4cqw'
                       : '1.7cqw';

  const founderName = 'Mohamed Abdelfattah';
  const instructorName = cert.instructor_name || founderName;

  const nameFontSize = cert.student_name.length > 30 ? '1.8cqw'
                     : cert.student_name.length > 20 ? '2.2cqw'
                     : '2.6cqw';

  return (
    <div className="min-h-screen bg-slate-200 p-4 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link href="/dashboard/student" className="text-slate-700 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button onClick={() => window.print()}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Printer className="w-4 h-4" /> Print / Save PDF
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
            {courseTitle}
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
            {cert.student_name}
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
            {courseTitle}
          </div>

          {/* Duration hours — center */}
          {cert.duration_hours > 0 && (
            <div
              className="absolute"
              style={{
                top: '64%', left: '5%', width: '55%', height: '4%',
                color: '#1e3a5f', fontWeight: 600, fontSize: '1.3cqw',
                lineHeight: 1,
                display: 'flex', alignItems: 'center',
              }}
            >
              {cert.duration_hours}H
            </div>
          )}

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
            Serial: {cert.serial_no}
          </div>
        </div>

        {/* Info card below certificate */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-yellow-500" />
            <div className="flex-1">
              <p className="text-slate-900 font-semibold">{cert.course_title}</p>
              <p className="text-sm text-slate-500">
                Issued: {issueDate.toLocaleDateString('en-US')} &middot;
                Serial: <span className="font-mono">{cert.serial_no}</span>
                {cert.instructor_name && ` · Instructor: ${cert.instructor_name}`}
                {cert.final_grade !== null && ` · Grade: ${cert.final_grade}/100`}
                {cert.duration_hours > 0 && ` · Duration: ${cert.duration_hours}h`}
              </p>
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
