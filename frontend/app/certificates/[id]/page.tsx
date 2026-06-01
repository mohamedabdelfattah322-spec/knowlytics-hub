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

          {/* ─── Course title — above "Certificate" ─── */}
          <div className="absolute" style={{
            top: '19%', left: '10%', width: '48%', height: '4%',
            color: '#1a4b7a', fontWeight: 800, fontSize: titleFontSize,
            fontStyle: 'italic',
            letterSpacing: '0.18em', lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center',
          }}>
            {courseTitle}
          </div>

          {/* ─── Student name — after "PRESENTED TO" ─── */}
          <div className="absolute" style={{
            top: '46%', left: '5%', width: '58%', height: '6%',
            color: '#1e293b',
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 700, fontSize: nameFontSize,
            lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden',
            display: 'flex', alignItems: 'center',
          }}>
            {cert.student_name}
          </div>

          {/* ─── "For the succesful completion of the course" + course name ─── */}
          <div className="absolute" style={{
            top: '53.5%', left: '5%', width: '70%', height: '4%',
            display: 'flex', alignItems: 'center', gap: '0.4cqw',
            lineHeight: 1,
          }}>
            <span style={{
              color: '#334155', fontWeight: 600, fontSize: '0.95cqw',
              fontStyle: 'italic', whiteSpace: 'nowrap',
            }}>
              For the succesful completion of the course
            </span>
            <span style={{
              color: '#1a4b7a', fontWeight: 800, fontSize: '0.95cqw',
              letterSpacing: '0.05em', whiteSpace: 'nowrap',
            }}>
              {courseTitle}
            </span>
          </div>

          {/* ─── Duration + Date row ─── */}
          <div className="absolute" style={{
            top: '64%', left: '5%', width: '80%', height: '5%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6cqw',
          }}>
            {cert.duration_hours > 0 && (
              <span style={{
                color: '#1a4b7a', fontWeight: 700, fontSize: '1.3cqw',
                fontStyle: 'italic',
              }}>
                « {cert.duration_hours}H »
              </span>
            )}
            <span style={{
              color: '#2e86ab', fontWeight: 600, fontSize: '1.4cqw',
            }}>
              {monthYear}
            </span>
          </div>

          {/* ─── Founder signature — LEFT ─── */}
          <div className="absolute" style={{
            bottom: '8%', left: '10%', width: '22%',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: '"Dancing Script", "Playfair Display", cursive, serif',
              fontStyle: 'italic', fontWeight: 700, fontSize: '1.5cqw',
              color: '#1e293b', marginBottom: '0.2cqw',
            }}>
              {founderName}
            </p>
            <div style={{ width: '80%', height: '1px', backgroundColor: '#1e293b', margin: '0 auto 0.3cqw' }} />
            <p style={{ fontSize: '0.85cqw', color: '#2e86ab', fontWeight: 700 }}>
              Founder
            </p>
          </div>

          {/* ─── Instructor signature — RIGHT ─── */}
          <div className="absolute" style={{
            bottom: '8%', left: '52%', width: '22%',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: '"Dancing Script", "Playfair Display", cursive, serif',
              fontStyle: 'italic', fontWeight: 700, fontSize: '1.5cqw',
              color: '#1e293b', marginBottom: '0.2cqw',
            }}>
              {instructorName}
            </p>
            <div style={{ width: '80%', height: '1px', backgroundColor: '#1e293b', margin: '0 auto 0.3cqw' }} />
            <p style={{ fontSize: '0.85cqw', color: '#2e86ab', fontWeight: 700 }}>
              Instructor
            </p>
          </div>

          {/* Serial */}
          <div className="absolute" style={{
            bottom: '1.5%', right: '1.5%', color: '#94a3b8', fontSize: '0.5cqw',
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
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');
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
