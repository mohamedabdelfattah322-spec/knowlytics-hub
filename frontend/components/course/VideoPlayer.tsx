'use client';
import { useRef, useEffect } from 'react';

interface Props {
  src: string;
  watermarkText: string;
  onEnded?: () => void;
}

export default function VideoPlayer({ src, watermarkText, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Block right-click & keyboard shortcuts on the video element
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const blockCtx = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+U (view source), F12
      if ((e.ctrlKey && ['s', 'u'].includes(e.key.toLowerCase())) || e.key === 'F12') {
        e.preventDefault();
      }
    };

    el.addEventListener('contextmenu', blockCtx);
    document.addEventListener('keydown', blockKeys);
    return () => {
      el.removeEventListener('contextmenu', blockCtx);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden select-none">
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        className="w-full h-full"
        onEnded={onEnded}
        playsInline
      />
      {/* Dynamic watermark — position shifts every 30s to prevent easy cropping */}
      <WatermarkOverlay text={watermarkText} />
    </div>
  );
}

function WatermarkOverlay({ text }: { text: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {/* Corner watermark */}
      <div className="absolute top-3 right-3 text-white/25 text-xs font-mono leading-tight text-right">
        {text}
        <br />
        {new Date().toLocaleString()}
      </div>
      {/* Centre diagonal watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: 'rotate(-30deg)' }}
      >
        <span className="text-white/[0.06] text-2xl font-bold whitespace-nowrap select-none">{text}</span>
      </div>
    </div>
  );
}
