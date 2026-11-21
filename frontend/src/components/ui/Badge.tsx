import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { getWarrantyMeta, statusBadgeClasses, statusDotClasses } from '../../lib/warranty';
import type { WarrantyStatus } from '../../types';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30',
  success:
    'bg-success-50 text-success-700 border-success-200 dark:bg-success-600/15 dark:text-success-400 dark:border-success-600/30',
  warning:
    'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30',
  danger:
    'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-600/15 dark:text-danger-400 dark:border-danger-600/30',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  neutral: 'bg-elevated text-subtle border-line',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  /** Optional leading dot; reinforces the colour with a shape. */
  dot?: boolean;
}

export function Badge({ tone = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Warranty status badge. The colour is always paired with a text label so the
 * status is understandable without relying on colour alone.
 */
export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status?: WarrantyStatus | null;
  className?: string;
  withDot?: boolean;
}) {
  const meta = getWarrantyMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        statusBadgeClasses(status),
        className,
      )}
      title={meta.description}
    >
      {withDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', statusDotClasses(status))} aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}

export default Badge;
