import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error wrapper used by all forms. */
export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required ? (
          <span className="ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
