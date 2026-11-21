import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import { SectionHeading } from './SectionHeading';

const ROWS = [
  {
    icon: CheckCircle2,
    tone: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-50 dark:bg-success-600/10 border-success-200 dark:border-success-600/30',
    title: 'MacBook Pro 14"',
    meta: 'Laptop · Apple',
    status: 'WARRANTY ACTIVE',
    statusClass: 'text-success-700 dark:text-success-400',
    detail: '428 days remaining · Expires 14 Jan 2027',
  },
  {
    icon: Clock,
    tone: 'text-warning-600 dark:text-warning-400',
    bg: 'bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/30',
    title: 'LG Washing Machine',
    meta: 'Home Appliance · LG',
    status: 'WARRANTY EXPIRING SOON',
    statusClass: 'text-warning-700 dark:text-warning-400',
    detail: '28 days remaining · Expires 10 Dec 2025',
  },
  {
    icon: XCircle,
    tone: 'text-danger-600 dark:text-danger-400',
    bg: 'bg-danger-50 dark:bg-danger-600/10 border-danger-200 dark:border-danger-600/30',
    title: 'Samsung Galaxy S21',
    meta: 'Mobile Phone · Samsung',
    status: 'WARRANTY EXPIRED',
    statusClass: 'text-danger-700 dark:text-danger-400',
    detail: 'Expired 25 days ago · 18 Oct 2025',
  },
];

/** Warranty Tracking section — explains status handling with a live-looking list. */
export function WarrantyTracking() {
  return (
    <section id="warranty" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Warranty tracking"
            title="Know exactly where every warranty stands"
            description="No more guessing whether coverage is still valid. BillNow calculates remaining days automatically and flags anything that needs your attention."
          />
          <ul className="mt-8 space-y-4">
            {[
              'Automatic status: active, expiring soon or expired.',
              'Clear "days remaining" counters and expiry dates.',
              'Colour is always backed by a text label — never colour alone.',
              'One-click reminders before coverage lapses.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-subtle">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.title}
                className={`flex items-start gap-4 rounded-xl border p-5 shadow-card ${row.bg}`}
              >
                <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${row.tone}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{row.title}</p>
                    <span className={`text-xs font-bold tracking-wide ${row.statusClass}`}>
                      {row.status}
                    </span>
                  </div>
                  <p className="text-sm text-subtle">{row.meta}</p>
                  <p className="mt-1 text-sm font-medium text-ink/80">{row.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WarrantyTracking;
