import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const levelColor = (level: string) => {
  const map: Record<string, string> = {
    Beginner: 'badge-green',
    Intermediate: 'badge-yellow',
    Advanced: 'badge-red',
  };
  return map[level] || 'badge-blue';
};

export const scoreLevel = (pct: number) =>
  pct >= 80 ? 'Advanced' : pct >= 50 ? 'Intermediate' : 'Beginner';
