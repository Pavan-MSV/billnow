import { Link } from 'react-router-dom';

import { APP_TAGLINE } from '../../lib/constants';
import { Logo } from '../ui/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'Warranty tracking', href: '#warranty' },
      { label: 'Security', href: '#security' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Create account', to: '/register' },
      { label: 'Sign in', to: '/login' },
      { label: 'Forgot password', to: '/forgot-password' },
    ],
  },
  {
    title: 'Legal & Privacy',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms and Conditions', to: '/terms' },
      { label: 'Request Account Deletion', to: '/delete-account' },
    ],
  },
];

/** Marketing footer. */
export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-subtle">
              {APP_TAGLINE} Your products, invoices and warranties — all in one place.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) =>
                  'href' in link ? (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-subtle transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-subtle transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} BillNow. All rights reserved.</p>
          <p>Built to keep your warranties in sight.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
