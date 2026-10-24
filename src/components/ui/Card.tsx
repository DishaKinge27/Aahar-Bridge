import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

/** Rounded white surface used across pages (matches reference cards). */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...rest}
    />
  );
}
