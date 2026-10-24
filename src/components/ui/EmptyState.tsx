import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}

/** Friendly empty / no-results state. */
export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/40">
        <Icon className="size-7 text-green-600 dark:text-green-400" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {text ? (
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{text}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
