'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function CertificateButton({
  courseId, batchId,
}: {
  courseId: string;
  batchId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const issue = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/certificates/issue', {
        course_id: courseId,
        batch_id: batchId || undefined,
      });
      toast.success('🏆 شهادتك جاهزة!');
      router.push(`/certificates/${data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل إصدار الشهادة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={issue} disabled={loading}
      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-500/30 transition-all">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
      🏆 احصل على الشهادة
    </button>
  );
}
