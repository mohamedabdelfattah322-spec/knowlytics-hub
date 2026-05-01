'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, ChevronRight, Award, Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Answer { id: string; text: string; order_index: number; }
interface Question { id: string; question_text: string; points: number; answers: Answer[]; }
interface Quiz { id: string; title: string; description: string; }
interface FeedbackItem { question_id: string; is_correct: boolean; correct_answer_id: string; points_earned: number; }

type Phase = 'loading' | 'quiz' | 'submitted';

const LEVEL_COLORS: Record<string, string> = {
  Advanced: 'text-green-400',
  Intermediate: 'text-yellow-400',
  Beginner: 'text-red-400',
};

export default function QuizPage() {
  const { id: courseId, quizId } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({}); // question_id → answer_id
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [result, setResult] = useState<{ score_pct: number; level: string; earned_points: number; total_points: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${quizId}`).then(({ data }) => {
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setPhase('quiz');
    }).catch(() => {
      toast.error('Could not load quiz');
      router.push(`/courses/${courseId}`);
    });
  }, [quizId]);

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const currentFeedback = feedback.find((f) => f.question_id === currentQ?.id);

  const pickAnswer = (answerId: string) => {
    if (answeredCurrent) return; // locked after answering
    setSelected((p) => ({ ...p, [currentQ.id]: answerId }));
    setAnsweredCurrent(true);

    // Instant feedback — show correct/wrong immediately (Duolingo style)
    const correct = currentQ.answers.find((a) => a.id === answerId);
    // We don't know which is correct until submit — so we'll reveal on submit
    // For instant feel, show a "locked in" state and let user advance
  };

  const next = () => {
    setAnsweredCurrent(false);
    if (isLast) {
      submitQuiz();
    } else {
      setCurrentIdx((i) => i + 1);
    }
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
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
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
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card text-center animate-slide-up">
          <Award className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-1">Quiz Complete!</h1>
          <p className="text-slate-400 mb-8">{quiz?.title}</p>

          {/* Score circle */}
          <div className="relative w-36 h-36 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - result.score_pct / 100)}`}
                strokeLinecap="round" className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-white">{result.score_pct}%</span>
            </div>
          </div>

          <p className="text-lg font-semibold mb-1">
            Level: <span className={levelColor}>{result.level}</span>
          </p>
          <p className="text-slate-400 text-sm mb-8">
            {result.earned_points} / {result.total_points} points
          </p>

          {/* Per-question breakdown */}
          <div className="text-left space-y-2 mb-8">
            {questions.map((q, i) => {
              const fb = feedback.find((f) => f.question_id === q.id);
              return (
                <div key={q.id} className={cn('flex items-start gap-3 p-3 rounded-lg', fb?.is_correct ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20')}>
                  {fb?.is_correct ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{q.question_text}</p>
                    {!fb?.is_correct && (
                      <p className="text-xs text-green-400 mt-1">
                        ✓ {q.answers.find((a) => a.id === fb?.correct_answer_id)?.text}
                      </p>
                    )}
                  </div>
                  <span className={cn('text-xs font-medium', fb?.is_correct ? 'text-green-400' : 'text-slate-500')}>
                    {fb?.points_earned}/{q.points}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Link href={`/courses/${courseId}`} className="btn-secondary flex-1">Back to Course</Link>
            <button onClick={() => { setPhase('quiz'); setCurrentIdx(0); setSelected({}); setAnsweredCurrent(false); }} className="btn-primary flex-1">Retry Quiz</button>
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
          <ChevronLeft className="w-4 h-4" /> Exit Quiz
        </Link>
        <div className="flex-1 progress-bar mx-4">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-slate-400 text-sm">{currentIdx + 1}/{questions.length}</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-6 animate-slide-up">
          {/* Question */}
          <div className="card">
            <p className="text-xs text-slate-500 mb-3">Question {currentIdx + 1} of {questions.length} · {currentQ?.points} point{currentQ?.points !== 1 ? 's' : ''}</p>
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
                    'w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 font-medium',
                    !answeredCurrent && !isSelected && 'border-dark-600 bg-dark-800 text-slate-300 hover:border-brand-500 hover:bg-brand-500/10',
                    isSelected && !answeredCurrent && 'border-brand-500 bg-brand-500/15 text-white',
                    isSelected && answeredCurrent && 'border-brand-500 bg-brand-500/20 text-white',
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                : isLast
                  ? <><Award className="w-4 h-4" /> Submit Quiz</>
                  : <>Next Question <ChevronRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
