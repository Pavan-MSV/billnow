import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { cn } from '../../lib/cn';
import { useNotifications } from '../../context/NotificationContext';
import { Logo } from '../ui/Logo';
import { SIDEBAR_ITEMS } from './nav';

/** Fixed desktop sidebar navigation. */
export function Sidebar() {
  const { unreadCount } = useNotifications();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <NavLink to="/dashboard" aria-label="BillNow home">
          <Logo />
        </NavLink>
      </div>

      <div className="px-4 pb-2">
        <NavLink
          to="/products/add"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Primary">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={!item.matchPrefix}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-subtle hover:bg-elevated hover:text-ink',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                  <span className="sr-only"> unread notifications</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="text-xs text-subtle">
          <span className="font-semibold text-ink">BillNow</span> — Never forget a warranty again.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
