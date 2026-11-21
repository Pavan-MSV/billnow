import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/cn';

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
} as const;

interface SpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}

/** Accessible loading spinner. */
export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <Loader2 className={cn('animate-spin text-brand-600 dark:text-brand-400', SIZES[size], className)} />
    </span>
  );
}

/** Full-panel centered spinner for page/section loading states. */
export function LoadingPanel({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <Spinner size="lg" label={label} />
      <p className="text-sm text-subtle">{label}</p>
    </div>
  );
}
