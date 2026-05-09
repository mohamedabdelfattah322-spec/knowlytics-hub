import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!num || num === 0) return 'مجاناً';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num)} جنيه`;
};

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
