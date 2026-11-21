import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#warranty', label: 'Warranty tracking' },
  { href: '#security', label: 'Security' },
];

/** Public marketing navigation bar. */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        scrolled
          ? 'border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="BillNow home">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-7 md:flex" aria-label="Marketing">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-subtle transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-subtle transition-colors hover:bg-elevated hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-subtle md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6" aria-label="Marketing mobile">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-subtle hover:bg-elevated hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-subtle hover:bg-elevated hover:text-ink"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
