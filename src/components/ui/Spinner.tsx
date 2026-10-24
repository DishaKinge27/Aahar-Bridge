import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Indeterminate loading indicator. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex items-center', className)}>
      <Loader2 className="size-5 animate-spin text-green-600 dark:text-green-400" aria-hidden="true" />
    </span>
  );
}
