'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, ChevronRight, Award, Loader2, ChevronLeft, Zap, Flame, Star, RotateCcw, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Answer { id: string; text: string; order_index: number; }
interface Question { id: string; question_text: string; points: number; answers: Answer[]; }
interface Quiz { id: string; title: string; description: string; }
interface FeedbackItem { question_id: string; is_correct: boolean; correct_answer_id: string; points_earned: number; }
interface Badge { id: string; name: string; name_ar: string; icon: string; xp_reward: number; condition_type: string; }
interface Attempt { score_pct: number; earned_points: number; total_points: number; level: string; created_at: string; }
interface UserStats { xp: number; level: number; streak_days: number; }

type Phase = 'loading' | 'quiz' | 'submitted';

const LEVEL_COLORS: Record<string, string> = {
  Advanced: 'text-green-400',
  Intermediate: 'text-yellow-400',
  Beginner: 'text-red-400',
};
const LEVEL_AR: Record<string, string> = {
  Advanced: 'متقدم',
  Intermediate: 'متوسط',
  Beginner: 'مبتدئ',
};

export default function QuizPage() {
  const { id: courseId, quizId } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [result, setResult] = useState<{
    score_pct: number; level: string; earned_points: number; total_points: number;
    xp_earned: number; new_badges: Badge[]; user_stats: UserStats; attempts: Attempt[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBadge, setShowBadge] = useState<Badge | null>(null);
  const [xpAnimated, setXpAnimated] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${quizId}`).then(({ data }) => {
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setPhase('quiz');
    }).catch(() => {
      toast.error('تعذر تحميل الكويز');
      router.push(`/courses/${courseId}`);
    });
  }, [quizId]);

  // Show badge popups one-by-one after results
  useEffect(() => {
    if (!result?.new_badges?.length) return;
    let i = 0;
    const show = () => {
      if (i >= result.new_badges.length) return;
      setShowBadge(result.new_badges[i]);
      i++;
      setTimeout(() => { setShowBadge(null); setTimeout(show, 400); }, 3000);
    };
    const t = setTimeout(show, 800);
    return () => clearTimeout(t);
  }, [result]);

  // Trigger XP bar animation
  useEffect(() => {
    if (phase === 'submitted') {
      const t = setTimeout(() => setXpAnimated(true), 300);
      return () => clearTimeout(t);
    }
    setXpAnimated(false);
  }, [phase]);

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const pickAnswer = (answerId: string) => {
    if (answeredCurrent) return;
    setSelected((p) => ({ ...p, [currentQ.id]: answerId }));
    setAnsweredCurrent(true);
  };

  const next = () => {
    setAnsweredCurrent(false);
    if (isLast) submitQuiz();
    else setCurrentIdx((i) => i + 1);
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const answers = Object.entries(selected).map(([question_id, answer_id]) => ({ question_id, answer_id }));
      const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers });
      setFeedback(data.feedback);
      setResult(data);
      setPhase('submitted');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  const retryQuiz = () => {
    setPhase('quiz');
    setCurrentIdx(0);
    setSelected({});
    setAnsweredCurrent(false);
    setResult(null);
    setXpAnimated(false);
  };

  // ── Loading ──────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  // ── Result Screen ────────────────────────────────────────
  if (phase === 'submitted' && result) {
    const levelColor = LEVEL_COLORS[result.level] || 'text-slate-300';
    const isPassed = result.score_pct >= 60;
    const xpInCurrentLevel = (result.user_stats?.xp || 0) % 500;
    const prevAttempts = result.attempts?.slice(1) || []; // exclude current (index 0)
    const bestScore = result.attempts?.length ? Math.max(...result.attempts.map(a => a.score_pct)) : result.score_pct;

    return (
      <div className="min-h-screen bg-dark-900">
        {/* Badge popup */}
        {showBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-bounce-in bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl px-8 py-6 text-center shadow-2xl backdrop-blur-sm">
              <div className="text-5xl mb-3">{showBadge.icon}</div>
              <p className="text-yellow-400 font-bold text-lg">إنجاز جديد!</p>
              <p className="text-white font-semibold text-xl mt-1">{showBadge.name_ar}</p>
              <p className="text-yellow-300 text-sm mt-1">+{showBadge.xp_reward} XP</p>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          {/* Score card */}
          <div className={cn(
            'card text-center border-2 transition-all',
            isPassed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/20'
          )}>
            <div className="text-4xl mb-3">{isPassed ? '🎉' : '💪'}</div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isPassed ? 'أحسنت!' : 'حاول مرة تانية'}
            </h1>
            <p className="text-slate-400 text-sm mb-6">{quiz?.title}</p>

            {/* Score circle */}
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={isPassed ? '#22c55e' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - result.score_pct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-white">{result.score_pct}%</span>
                <span className="text-xs text-slate-400">{result.earned_points}/{result.total_points} نقطة</span>
              </div>
            </div>

            <p className="text-lg font-semibold mb-1">
              المستوى: <span className={levelColor}>{LEVEL_AR[result.level] || result.level}</span>
            </p>
          </div>

          {/* XP + Streak + Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center py-4">
              <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-400">+{result.xp_earned}</p>
              <p className="text-xs text-slate-400">XP مكتسب</p>
            </div>
            <div className="card text-center py-4">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-400">{result.user_stats?.streak_days || 0}</p>
              <p className="text-xs text-slate-400">يوم متواصل</p>
            </div>
            <div className="card text-center py-4">
              <Star className="w-5 h-5 text-brand-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-brand-400">{bestScore}%</p>
              <p className="text-xs text-slate-400">أفضل نتيجة</p>
            </div>
          </div>

          {/* XP Level bar */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">المستوى {result.user_stats?.level || 1}</span>
              <span className="text-xs text-slate-400">{(result.user_stats?.xp || 0)} XP إجمالي</span>
            </div>
            <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: xpAnimated ? `${(xpInCurrentLevel / 500) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">{xpInCurrentLevel}/500 للمستوى التالي</p>
          </div>

          {/* New badges */}
          {result.new_badges?.length > 0 && (
            <div className="card border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> إنجازات جديدة 🎊
              </p>
              <div className="flex flex-wrap gap-3">
                {result.new_badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
                    <span className="text-2xl">{b.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{b.name_ar}</p>
                      <p className="text-xs text-yellow-400">+{b.xp_reward} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-question breakdown */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3 text-sm">تفاصيل الإجابات</h3>
            <div className="space-y-2">
              {questions.map((q, i) => {
                const fb = feedback.find((f) => f.question_id === q.id);
                return (
                  <div key={q.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    fb?.is_correct ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'
                  )}>
                    {fb?.is_correct
                      ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">{q.question_text}</p>
                      {!fb?.is_correct && (
                        <p className="text-xs text-green-400 mt-1">
                          ✓ الإجابة الصح: {q.answers.find((a) => a.id === fb?.correct_answer_id)?.text}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-xs font-medium flex-shrink-0', fb?.is_correct ? 'text-green-400' : 'text-slate-500')}>
                      {fb?.points_earned}/{q.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Previous attempts */}
          {prevAttempts.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3 text-sm">محاولاتك السابقة</h3>
              <div className="space-y-2">
                {prevAttempts.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      a.score_pct >= 80 ? 'bg-green-500/20 text-green-400' :
                      a.score_pct >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      {a.score_pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', a.score_pct >= 80 ? 'bg-green-500' : a.score_pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: `${a.score_pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(a.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Link href={`/courses/${courseId}`} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" /> الكورس
            </Link>
            <button onClick={retryQuiz} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz Phase ───────────────────────────────────────────
  const progress = ((currentIdx + (answeredCurrent ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-dark-700 px-6 py-3 flex items-center gap-4 bg-dark-800">
        <Link href={`/courses/${courseId}`} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> خروج
        </Link>
        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden mx-4">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-slate-400 text-sm">{currentIdx + 1}/{questions.length}</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-6 animate-slide-up">
          {/* Question */}
          <div className="card">
            <p className="text-xs text-slate-500 mb-3">
              السؤال {currentIdx + 1} من {questions.length} · {currentQ?.points} نقطة
            </p>
            <h2 className="text-xl font-bold text-white">{currentQ?.question_text}</h2>
          </div>

          {/* Answers */}
          <div className="space-y-3">
            {currentQ?.answers.map((answer) => {
              const isSelected = selected[currentQ.id] === answer.id;
              return (
                <button
                  key={answer.id}
                  onClick={() => pickAnswer(answer.id)}
                  disabled={answeredCurrent}
                  className={cn(
                    'w-full text-right px-5 py-4 rounded-xl border-2 transition-all duration-200 font-medium',
                    !answeredCurrent && !isSelected && 'border-dark-600 bg-dark-800 text-slate-300 hover:border-brand-500 hover:bg-brand-500/10',
                    isSelected && 'border-brand-500 bg-brand-500/20 text-white',
                    !isSelected && answeredCurrent && 'border-dark-600 bg-dark-800 text-slate-500 cursor-not-allowed opacity-60'
                  )}
                >
                  {answer.text}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          {answeredCurrent && (
            <button
              onClick={next}
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 animate-fade-in"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
                : isLast
                  ? <><Award className="w-4 h-4" /> إنهاء الكويز</>
                  : <>السؤال التالي <ChevronRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
