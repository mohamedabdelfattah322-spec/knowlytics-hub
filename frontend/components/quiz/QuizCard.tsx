'use client';
import { cn } from '@/lib/utils';

interface Answer { id: string; text: string; }

interface Props {
  questionText: string;
  questionNumber: number;
  totalQuestions: number;
  points: number;
  answers: Answer[];
  selectedId: string | null;
  locked: boolean;
  onSelect: (answerId: string) => void;
}

export default function QuizCard({
  questionText, questionNumber, totalQuestions, points,
  answers, selectedId, locked, onSelect,
}: Props) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="bg-brand-500/15 text-brand-400 px-2.5 py-1 rounded-full font-medium">
            {points} pt{points !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-lg font-semibold text-white leading-snug">{questionText}</p>
      </div>

      <div className="space-y-3">
        {answers.map((a) => {
          const isSelected = selectedId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => !locked && onSelect(a.id)}
              disabled={locked}
              className={cn(
                'w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                !locked && !isSelected && 'border-dark-600 bg-dark-800 text-slate-300 hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-white',
                isSelected && 'border-brand-500 bg-brand-500/20 text-white scale-[1.01]',
                locked && !isSelected && 'border-dark-600 bg-dark-800 text-slate-600 cursor-not-allowed',
              )}
            >
              {a.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
