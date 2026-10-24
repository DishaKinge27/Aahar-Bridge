import { initials as toInitials } from '../../utils/format';
import { cn } from '../../utils/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'size-9 text-sm',
  md: 'size-12 text-base',
  lg: 'size-14 text-lg',
};

/** Initials circle used in the messenger header and user menus. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 dark:bg-green-900/60 dark:text-green-300',
        SIZES[size],
        className,
      )}
    >
      {toInitials(name)}
    </span>
  );
}
