import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'slate';

const TONES: Record<BadgeTone, string> = {
  green:
    'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
  amber:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Small pill label used for diet types and statuses. */
export function Badge({ tone = 'green', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
