import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type AlertVariant = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const STYLES: Record<AlertVariant, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper:
      'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/60 dark:text-green-300',
    icon: <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />,
  },
  error: {
    wrapper:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300',
    icon: <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />,
  },
  info: {
    wrapper:
      'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
    icon: <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />,
  },
  warning: {
    wrapper:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
    icon: (
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
    ),
  },
};

/** Status / error message banner. */
export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: AlertProps) {
  const style = STYLES[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm', style.wrapper, className)}
    >
      {style.icon}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-m-1 rounded p-1 opacity-70 transition hover:opacity-100"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
