'use client';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';

interface ThemeLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function ThemeLogo({ width = 180, height = 50, className = 'object-contain', priority = false }: ThemeLogoProps) {
  const { theme } = useTheme();
  // Light theme → dark logo, all other themes → white logo
  const src = theme === 'light' ? '/logo-dark.png' : '/logo-white.png';

  return (
    <Image
      src={src}
      alt="Knowlytics Hub"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
