'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface GuideStep {
  /** CSS selector for the target element to highlight */
  target?: string;
  /** Title in Arabic */
  titleAr: string;
  /** Title in English */
  titleEn: string;
  /** Description in Arabic */
  descAr: string;
  /** Description in English */
  descEn: string;
}

interface PageGuideProps {
  /** Unique page identifier (e.g. 'student-dashboard', 'courses-catalog') */
  pageId: string;
  /** Guide steps for this page */
  steps: GuideStep[];
  /** Force-open the guide (for manual re-trigger) */
  forceOpen?: boolean;
  /** Callback when guide closes */
  onClose?: () => void;
}

// ─── First-Visit Banner ────────────────────────────────
function GuideBanner({ onStart, onDismiss, isAr }: { onStart: () => void; onDismiss: () => void; isAr: boolean }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border"
           style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(59,130,246,0.3)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
             style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
          <Lightbulb className="w-5 h-5" style={{ color: '#60a5fa' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
          {isAr ? 'أول مرة تزور الصفحة دي؟ عايز جولة سريعة؟' : 'First time here? Want a quick tour?'}
        </p>
        <button
          onClick={onStart}
          className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
        >
          {isAr ? 'يلا!' : "Let's go!"}
        </button>
        <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>
    </div>
  );
}

// ─── Guide Overlay with Steps ──────────────────────────
function GuideOverlay({ steps, onClose, isAr }: { steps: GuideStep[]; onClose: () => void; isAr: boolean }) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const step = steps[current];
  const isLast = current === steps.length - 1;

  const highlightTarget = useCallback(() => {
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          setRect(el.getBoundingClientRect());
        }, 350);
        return;
      }
    }
    setRect(null);
  }, [step]);

  useEffect(() => {
    highlightTarget();
    const handle = () => setTimeout(highlightTarget, 100);
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle);
    };
  }, [highlightTarget]);

  const next = () => { if (!isLast) setCurrent(c => c + 1); else onClose(); };
  const prev = () => { if (current > 0) setCurrent(c => c - 1); };

  const pad = 8;
  const spotStyle = rect ? {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  } : null;

  // Position tooltip near highlighted element
  const tooltipStyle: React.CSSProperties = {};
  if (rect) {
    const centerX = rect.left + rect.width / 2;
    const below = rect.bottom + pad + 16;
    const above = rect.top - pad - 16;

    if (below + 200 < window.innerHeight) {
      tooltipStyle.top = below;
    } else {
      tooltipStyle.bottom = window.innerHeight - above;
    }

    if (centerX < window.innerWidth / 2) {
      tooltipStyle.left = Math.max(16, rect.left);
    } else {
      tooltipStyle.right = Math.max(16, window.innerWidth - rect.right);
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[95]" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      {/* Dark overlay with spotlight cutout using box-shadow */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        {spotStyle && (
          <div className="absolute rounded-xl transition-all duration-300" style={{
            ...spotStyle,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            backgroundColor: 'transparent',
            border: '2px solid rgba(59,130,246,0.6)',
            zIndex: 1,
          }} />
        )}
      </div>

      {/* Tooltip */}
      <div className="fixed z-[96] w-80 max-w-[calc(100vw-32px)] transition-all duration-300" style={tooltipStyle}>
        <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Progress bar */}
          <div className="h-1 w-full" style={{ backgroundColor: '#e5e7eb' }}>
            <div className="h-full transition-all duration-300 rounded-full"
                 style={{ width: `${((current + 1) / steps.length) * 100}%`, backgroundColor: '#3b82f6' }} />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                {current + 1}/{steps.length}
              </span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
              </button>
            </div>

            <h3 className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>
              {isAr ? step.titleAr : step.titleEn}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              {isAr ? step.descAr : step.descEn}
            </p>

            <div className="flex items-center justify-between mt-4 gap-2">
              <button
                onClick={prev}
                disabled={current === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ color: '#64748b' }}
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {isAr ? 'السابق' : 'Back'}
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              >
                {isLast
                  ? (isAr ? 'تمام!' : 'Done!')
                  : (isAr ? 'التالي' : 'Next')
                }
                {!isLast && (isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main PageGuide Component ──────────────────────────
export default function PageGuide({ pageId, steps, forceOpen, onClose: onCloseProp }: PageGuideProps) {
  const { isAr } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Auto-show banner on first visit
  useEffect(() => {
    if (forceOpen) return; // skip auto-banner when manually triggered
    const key = `kh_guide_${pageId}`;
    const visited = localStorage.getItem(key);
    if (!visited) {
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [pageId, forceOpen]);

  // Handle forceOpen from parent
  useEffect(() => {
    if (forceOpen) setShowGuide(true);
  }, [forceOpen]);

  const startGuide = () => {
    setShowBanner(false);
    setShowGuide(true);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(`kh_guide_${pageId}`, 'done');
  };

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem(`kh_guide_${pageId}`, 'done');
    onCloseProp?.();
  };

  return (
    <>
      {showBanner && !forceOpen && <GuideBanner onStart={startGuide} onDismiss={dismissBanner} isAr={isAr} />}
      {showGuide && <GuideOverlay steps={steps} onClose={closeGuide} isAr={isAr} />}
    </>
  );
}

// ─── Floating Guide Button (for re-triggering) ────────
export function GuideButton({ onClick }: { onClick: () => void }) {
  const { isAr } = useLanguage();
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 z-40 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
      style={{ backgroundColor: '#1e3a5f', right: isAr ? 'auto' : '1.5rem', left: isAr ? '1.5rem' : 'auto' }}
      title={isAr ? 'دليل الصفحة' : 'Page Guide'}
    >
      <HelpCircle className="w-5 h-5" style={{ color: '#60a5fa' }} />
    </button>
  );
}
