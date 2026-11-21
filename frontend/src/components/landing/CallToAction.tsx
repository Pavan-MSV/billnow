import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Closing call-to-action band. */
export function CallToAction() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-5 py-10 text-center shadow-pop sm:rounded-3xl sm:px-14 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/5"
          />
          <h2 className="relative mx-auto max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Never forget a warranty again.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-brand-50">
            Set up your first product in under a minute and let BillNow keep watch.
          </p>
          <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50 sm:h-auto sm:py-3"
            >
              Get Started — it&apos;s free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:h-auto sm:py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
