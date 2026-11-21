import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { APP_TAGLINE } from '../../lib/constants';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh w-full bg-slate-100/70 dark:bg-slate-950 sm:flex sm:justify-center transition-colors">
      {/* Mobile Device Canvas - Phone Dimensions Only */}
      <div className="relative flex min-h-dvh w-full flex-col justify-between bg-bg text-ink shadow-lg sm:max-w-[440px] p-6">

        {/* Top bar with ThemeToggle and subtle logo */}
        <div className="flex items-center justify-between pb-4">
          <Link to="/" aria-label="BillNow Home" className="active:scale-95 transition-transform">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Body */}
        <div className="my-auto py-4">
          {/* Tagline / Sub-badge */}
          <div className="mb-4 inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {APP_TAGLINE}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-xs text-subtle leading-relaxed">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 text-center text-xs text-subtle border-t border-line/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
