import { Eye, KeyRound, Lock, ServerCog } from 'lucide-react';

import { SectionHeading } from './SectionHeading';

const POINTS = [
  {
    icon: Lock,
    title: 'Encrypted credentials',
    description:
      'Passwords are hashed with bcrypt — never stored in plain text. Sessions use short-lived JWT access tokens.',
  },
  {
    icon: KeyRound,
    title: 'Secure token refresh',
    description:
      'Access tokens refresh automatically and are rotated. Sign out of one session or all of them at any time.',
  },
  {
    icon: Eye,
    title: 'Your data stays yours',
    description:
      'Invoices and product records are private to your account. Export everything whenever you want, or delete it.',
  },
  {
    icon: ServerCog,
    title: 'Built on a real API',
    description:
      'BillNow talks to a hardened REST backend with validation, rate limiting and file-type checks on every upload.',
  },
];

/** Security & privacy section. */
export function SecurityPrivacy() {
  return (
    <section id="security" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Security & privacy"
          title="Careful by default"
          description="Your purchase history and invoices are sensitive. We treat them that way — from password storage to file uploads."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="flex gap-4 rounded-xl border border-line bg-surface p-6 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-subtle">{point.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SecurityPrivacy;
