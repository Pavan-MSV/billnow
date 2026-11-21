import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

import { cn } from '../../lib/cn';
import { useNotifications } from '../../context/NotificationContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserMenu } from './UserMenu';

function NotificationBell({ className }: { className?: string }) {
  const { unreadCount } = useNotifications();
  return (
    <Link
      to="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-subtle transition-colors hover:bg-elevated hover:text-ink',
        className,
      )}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white ring-2 ring-surface">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

/** Sticky top bar: search, theme toggle, notifications and account menu. */
export function Topbar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        <Link to="/dashboard" className="lg:hidden" aria-label="BillNow home">
          <Logo markOnly />
        </Link>

        <form onSubmit={onSearch} role="search" className="relative hidden flex-1 sm:block sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, brands, invoices…"
            aria-label="Search products"
            className="h-10 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-subtle/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/products"
            aria-label="Search products"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-subtle transition-colors hover:bg-elevated hover:text-ink sm:hidden"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
