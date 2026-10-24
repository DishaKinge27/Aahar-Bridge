import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

/** Shimmering placeholder block used while data loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)}
    />
  );
}
