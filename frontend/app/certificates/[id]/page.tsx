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
  const titleFontSize = courseTitle.length > 30 ? '0.85cqw'
                       : courseTitle.length > 20 ? '1.0cqw'
                       : '1.3cqw';

  const founderName = 'Mohamed Abdelfattah';
  const instructorName = cert.instructor_name || founderName;
  const isSameAsFounder = instructorName === founderName;

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
              top: '27.5%', left: '14%', width: '40%', height: '3.3%',
              color: '#1e3a5f', fontWeight: 700, fontSize: titleFontSize,
              letterSpacing: '0.1em', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center',
            }}
          >
            {courseTitle}
          </div>

          {/* Student name */}
          <div
            className="absolute"
            style={{
              top: '50.5%', left: '14%', width: '40%', height: '4%',
              color: '#1e293b',
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontStyle: 'italic', fontWeight: 600, fontSize: '2cqw',
              lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden',
              display: 'flex', alignItems: 'center',
            }}
          >
            {cert.student_name}
          </div>

          {/* Date */}
          <div
            className="absolute"
            style={{
              top: '54.7%', left: '64.1%', width: '12.1%', height: '4%',
              color: '#475569', fontWeight: 500, fontSize: '1.05cqw',
              lineHeight: 1, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {monthYear}
          </div>

          {/* ── Signatures Area (overlaying the bottom of template) ── */}
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
            bottom: '0.5%', right: '0.7%', color: '#94a3b8', fontSize: '0.55cqw',
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
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
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
