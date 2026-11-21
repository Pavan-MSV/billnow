import { CalendarClock, ShieldCheck, ShieldOff, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatDate, parseDate, daysBetween } from '../../lib/format';
import { warrantyHeadline, getWarrantyMeta, resolveDaysRemaining, type StatusTone } from '../../lib/warranty';
import type { Product } from '../../types';

const TONE_STYLES: Record<StatusTone, { wrapper: string; badge: string; progress: string }> = {
  success: {
    wrapper: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:border-emerald-500/25 dark:from-emerald-950/25 dark:to-teal-950/15',
    badge: 'bg-emerald-600 text-white',
    progress: 'bg-emerald-600 dark:bg-emerald-500',
  },
  warning: {
    wrapper: 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:border-amber-500/25 dark:from-amber-950/25 dark:to-orange-950/15',
    badge: 'bg-amber-500 text-white',
    progress: 'bg-amber-500 dark:bg-amber-400',
  },
  danger: {
    wrapper: 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-pink-50/40 dark:border-rose-500/25 dark:from-rose-950/25 dark:to-pink-950/15',
    badge: 'bg-rose-600 text-white',
    progress: 'bg-rose-600 dark:bg-rose-500',
  },
  brand: {
    wrapper: 'border-brand-200 bg-brand-50/60 dark:border-brand-500/25 dark:bg-brand-950/20',
    badge: 'bg-brand-600 text-white',
    progress: 'bg-brand-600',
  },
  neutral: {
    wrapper: 'border-line bg-surface',
    badge: 'bg-slate-500 text-white',
    progress: 'bg-slate-400',
  },
};

const ICONS: Record<StatusTone, typeof ShieldCheck> = {
  success: ShieldCheck,
  warning: TriangleAlert,
  danger: ShieldOff,
  brand: ShieldCheck,
  neutral: CalendarClock,
};

export function WarrantyStatusCard({ product }: { product: Product }) {
  const meta = getWarrantyMeta(product.warranty_status);
  const days = resolveDaysRemaining(product.warranty_days_remaining, product.warranty_end_date);
  const headline = warrantyHeadline(product.warranty_status, days, product.warranty_end_date);
  const styles = TONE_STYLES[headline.tone];
  const Icon = ICONS[headline.tone];

  // Visual warranty progress calculation
  let progressPercent = 0;
  const startDate = parseDate(product.warranty_start_date || product.purchase_date);
  const endDate = parseDate(product.warranty_end_date);
  const today = new Date();

  if (startDate && endDate) {
    const totalDuration = daysBetween(startDate, endDate);
    if (totalDuration > 0) {
      const elapsed = daysBetween(startDate, today);
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    }
  } else if (meta.status === 'expired') {
    progressPercent = 100;
  }

  return (
    <section
      className={cn('rounded-2xl border p-4 shadow-sm select-none', styles.wrapper)}
      aria-label="Warranty Status & Progress"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl shadow-sm', styles.badge)}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-subtle/90">
              Warranty Status
            </span>
            <h2 className="text-base font-extrabold tracking-tight text-ink">
              {headline.title}
            </h2>
          </div>
        </div>

        {days !== null && (
          <div className="text-right">
            <span className="text-lg font-black text-ink">
              {Math.abs(days)}
            </span>
            <span className="block text-[10px] font-bold uppercase text-subtle">
              {meta.status === 'expired' ? 'Days Ago' : 'Days Left'}
            </span>
          </div>
        )}
      </div>

      {/* 12. Visual Warranty Progress Indicator */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-subtle">
          <span>Warranty Timeline</span>
          <span>{meta.status === 'expired' ? '100% elapsed' : `${progressPercent}% elapsed`}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
          <div
            className={cn('h-full transition-all duration-700 ease-out', styles.progress)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between pt-0.5 text-[10px] text-subtle font-medium">
          <span>Start: {formatDate(product.warranty_start_date || product.purchase_date)}</span>
          <span>End: {formatDate(product.warranty_end_date)}</span>
        </div>
      </div>

      {/* Warranty Specs Row */}
      <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-line/40 pt-3 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-subtle">Coverage Period</span>
          <p className="font-semibold text-ink mt-0.5">
            {product.warranty_period_months
              ? `${product.warranty_period_months} months (${(product.warranty_period_months / 12).toFixed(1)} yrs)`
              : 'Standard coverage'}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-subtle">Status</span>
          <p className="font-bold text-ink mt-0.5 uppercase tracking-wide">
            {meta.label}
          </p>
        </div>
      </div>
    </section>
  );
}

export default WarrantyStatusCard;
