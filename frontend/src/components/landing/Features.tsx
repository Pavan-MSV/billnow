import {
  BarChart3,
  BellRing,
  Files,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import { SectionHeading } from './SectionHeading';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Warranty tracking',
    description:
      'Every product shows its live status — active, expiring soon or expired — with days remaining at a glance.',
  },
  {
    icon: Files,
    title: 'Invoice vault',
    description:
      'Store PDFs and photos of your bills next to each product. View or download them whenever you need a claim.',
  },
  {
    icon: BellRing,
    title: 'Smart reminders',
    description:
      'Configurable alerts 90, 60, 30, 7 and 1 day before a warranty ends, delivered where you want them.',
  },
  {
    icon: RefreshCw,
    title: 'Service history',
    description:
      'Log repairs, servicing and maintenance with costs, providers and next-service dates in one timeline.',
  },
  {
    icon: BarChart3,
    title: 'Insights & spending',
    description:
      'See what you own, where your money goes and which warranties are about to lapse, with clean charts.',
  },
  {
    icon: Wallet,
    title: 'Multi-currency',
    description:
      'Track purchases in your preferred currency with proper Indian number formatting and totals.',
  },
];

/** Feature grid. */
export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to manage what you own"
          description="Built for real life — receipts in a drawer, warranties you forget, and service visits you lose track of."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
