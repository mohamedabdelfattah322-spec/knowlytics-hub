'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Award, Trophy, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string; question_text: string;
  answers: { id: string; answer_text: string }[];
}

export default function FinalExamPage() {
  const { id: courseId } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [started, setStarted] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    api.get(`/courses/${courseId}/final-quiz-status`)
      .then(({ data }) => setStatus(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStatus(); }, [courseId]);

  const startQuiz = async () => {
    if (!status?.final_quiz) return;
    try {
      const { data } = await api.get(`/quizzes/${status.final_quiz.id}`);
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setStarted(true);
    } catch { toast.error('فشل تحميل الامتحان'); }
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm(`أنت أجبت على ${Object.keys(answers).length} من ${questions.length} سؤال. هل تريد التسليم؟`)) return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${quiz.id}/submit`, {
        answers: Object.entries(answers).map(([question_id, answer_id]) => ({ question_id, answer_id })),
      });
      setResult(data);
      loadStatus(); // refresh status
    } catch { toast.error('فشل التسليم'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
  </div>;

  // ─── Result screen ──────────────────────────────
  if (result) {
    const passed = result.score_pct >= (quiz?.passing_score || 60);
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <div className={cn('w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4',
            passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {passed ? '🎉 مبروك، نجحت!' : '😔 لم تنجح هذه المرة'}
          </h1>
          <p className={cn('text-4xl font-bold my-6', passed ? 'text-green-400' : 'text-red-400')}>
            {result.score_pct}%
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {result.earned_points} / {result.total_points} نقطة
            {!passed && quiz && <> · النجاح من {quiz.passing_score}%</>}
          </p>

          {passed ? (
            <Link href={`/courses/${courseId}`} className="btn-primary w-full flex items-center justify-center gap-2">
              <Award className="w-4 h-4" /> احصل على الشهادة
            </Link>
          ) : (
            <div className="space-y-2">
              <button onClick={() => { setResult(null); setStarted(false); setAnswers({}); }}
                className="btn-primary w-full">حاول مرة أخرى</button>
              <Link href={`/courses/${courseId}`} className="btn-secondary w-full block text-center">
                رجوع للكورس
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Locked: lessons not done ───────────────────
  if (!status?.lessons_done && !started) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <Lock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">الامتحان مقفول</h1>
          <p className="text-slate-400 mb-4">لازم تخلص كل دروس الكورس عشان الامتحان النهائي يفتحلك.</p>
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <p className="text-slate-300 mb-2">تقدمك:</p>
            <p className="text-2xl font-bold text-brand-400">
              {status?.completed_lessons || 0} / {status?.total_lessons || 0}
            </p>
            <div className="progress-bar mt-3">
              <div className="progress-fill" style={{
                width: `${status?.total_lessons ? Math.round(((status.completed_lessons || 0) / status.total_lessons) * 100) : 0}%`
              }} />
            </div>
          </div>
          <Link href={`/courses/${courseId}`} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> ارجع كمل الدروس
          </Link>
        </div>
      </div>
    );
  }

  // ─── No final quiz exists ───────────────────────
  if (!status?.final_quiz) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-white">مفيش امتحان نهائي للكورس ده.</p>
          <Link href={`/courses/${courseId}`} className="btn-primary inline-flex items-center gap-2 mt-4">
            <ArrowLeft className="w-4 h-4" /> رجوع
          </Link>
        </div>
      </div>
    );
  }

  // ─── Intro before starting ──────────────────────
  if (!started) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{status.final_quiz.title}</h1>
              <p className="text-xs text-slate-400">الامتحان النهائي</p>
            </div>
          </div>
          {status.final_quiz.description && (
            <p className="text-slate-300 mb-4">{status.final_quiz.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400">درجة النجاح</p>
              <p className="text-lg font-bold text-green-400">{status.final_quiz.passing_score}%</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400">المحاولات</p>
              <p className="text-lg font-bold text-brand-400">غير محدودة</p>
            </div>
          </div>

          {status.my_attempt && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-sm">
                ✓ آخر محاولة: <strong>{status.my_attempt.score_pct}%</strong>
                {status.passed && ' — نجحت!'}
              </p>
            </div>
          )}

          <button onClick={startQuiz} className="btn-primary w-full">
            {status.my_attempt ? 'حاول مرة أخرى' : 'ابدأ الامتحان'}
          </button>
          <Link href={`/courses/${courseId}`} className="btn-secondary w-full mt-2 block text-center">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  // ─── Quiz in progress ───────────────────────────
  return (
    <div className="min-h-screen bg-dark-900 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">{quiz?.title}</h1>
          <span className="text-sm text-slate-400">
            {Object.keys(answers).length} / {questions.length} سؤال
          </span>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="card">
              <p className="font-medium text-white mb-3">
                <span className="text-brand-400 font-bold mr-2">{i + 1}.</span>
                {q.question_text}
              </p>
              <div className="space-y-2">
                {q.answers.map((a) => (
                  <button key={a.id}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: a.id }))}
                    className={cn('w-full text-right p-3 rounded-lg border text-sm transition-all',
                      answers[q.id] === a.id
                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-200'
                        : 'border-dark-600 text-slate-300 hover:border-brand-500/30 hover:bg-dark-700/50'
                    )}>
                    {answers[q.id] === a.id && <CheckCircle2 className="w-4 h-4 inline ml-2 text-brand-400" />}
                    {a.answer_text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => { if (confirm('إلغاء وفقد إجاباتك؟')) router.push(`/courses/${courseId}`); }}
            className="btn-secondary">إلغاء</button>
          <button onClick={submit} disabled={submitting}
            className="btn-primary flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            تسليم الامتحان
          </button>
        </div>
      </div>
    </div>
  );
}
