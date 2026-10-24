import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatTone = 'green' | 'amber' | 'blue' | 'slate';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: StatTone;
}

const TONES: Record<StatTone, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

/** Dashboard metric card. */
export function StatCard({ icon: Icon, label, value, tone = 'green' }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-8 text-slate-900 dark:text-slate-50">{value}</p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
