import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'soft' | 'outline' | 'white' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'rounded' | 'pill';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-green-600 text-white shadow-sm hover:bg-green-700 focus-visible:ring-green-500 dark:bg-green-600 dark:hover:bg-green-500',
  soft: 'bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-500 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  white:
    'bg-white text-green-900 shadow-sm hover:bg-green-50 focus-visible:ring-white dark:bg-white dark:text-green-900',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-500 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

/** Class string for buttons — also used on links that should look like buttons. */
export function buttonClasses(options: ButtonStyleOptions = {}): string {
  const { variant = 'primary', size = 'md', shape = 'rounded', className } = options;
  return cn(
    'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    shape === 'pill' ? 'rounded-full' : 'rounded-lg',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, shape, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
