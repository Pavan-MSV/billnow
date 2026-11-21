import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { APP_SUPPORTING, APP_TAGLINE } from '../../lib/constants';
import { PhoneFrame } from './PhoneFrame';

/** Hero section with the primary value proposition and a warranty-card visual. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft brand backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-bg to-bg dark:from-brand-950/40 dark:via-bg dark:to-bg"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/10"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:gap-14 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Product, invoice &amp; warranty tracker
          </span>

          <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {APP_TAGLINE}
          </h1>

          <p className="mt-5 max-w-xl text-base text-subtle sm:text-lg">{APP_SUPPORTING}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/register"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:h-auto sm:w-auto sm:py-3"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-elevated sm:h-auto sm:w-auto sm:py-3"
            >
              Sign In
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: ShieldCheck, label: 'Warranty alerts' },
              { icon: FileText, label: 'Invoice vault' },
              { icon: CalendarClock, label: 'Service history' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col gap-2">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <dd className="text-sm font-medium text-subtle">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Portrait phone with warranty card */}
        <div className="relative animate-slide-up">
          <PhoneFrame>
            <div className="flex min-h-[560px] flex-col bg-bg px-4 pb-8 pt-3">
              <div className="flex items-end justify-between px-2 pb-2 text-[11px] font-semibold text-ink">
                <span>9:41</span>
                <span className="h-2 w-4 rounded-sm border border-ink/70" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
                Product
              </p>
              <h2 className="mt-1 text-lg font-bold text-ink">Sony WH-1000XM5</h2>
              <p className="text-xs text-subtle">Audio · Purchased 12 Feb 2024</p>

              <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                      Warranty status
                    </p>
                    <p className="mt-1 text-sm font-medium text-subtle">Manufacturer cover</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-600/30 dark:bg-success-600/10">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-success-600 dark:text-success-400" aria-hidden="true" />
                    <p className="text-sm font-extrabold tracking-tight text-success-700 dark:text-success-400">
                      WARRANTY ACTIVE
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-success-700/90 dark:text-success-400/90">
                    340 days left · 11 Nov 2026
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-success-600/20">
                    <div className="h-full w-[72%] rounded-full bg-success-600" />
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {[
                    { label: 'Invoice', value: 'invoice-sony-xm5.pdf' },
                    { label: 'Serial', value: 'SN-8842-1190' },
                    { label: 'Coverage', value: '24 months' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-subtle">{row.label}</span>
                      <span className="max-w-[60%] truncate font-medium text-ink">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-[11px] font-medium text-subtle">
                Reminder queued · 30 days before expiry
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

export default Hero;
