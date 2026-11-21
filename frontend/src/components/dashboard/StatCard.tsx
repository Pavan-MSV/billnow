import type { LucideIcon } from 'lucide-react';

import { cn } from '../../lib/cn';

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400',
  neutral: 'bg-elevated text-subtle',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
}

/** Compact metric card used on the dashboard. */
export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-subtle sm:text-sm">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9', TONES[tone])}>
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-ink sm:mt-3 sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

export default StatCard;
