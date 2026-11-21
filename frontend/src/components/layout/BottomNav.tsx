import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useNotifications } from '../../context/NotificationContext';

export interface MobileNavItem {
  to: string;
  label: string;
  icon: typeof Home;
  showBadge?: boolean;
  matchPrefix?: boolean;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/products', label: 'Products', icon: Package, matchPrefix: true },
  { to: '/notifications', label: 'Alerts', icon: Bell, showBadge: true },
  { to: '/settings', label: 'Account', icon: User },
];

/**
 * Mobile-First Fixed Bottom Navigation Bar.
 * On desktop, stays perfectly centered within the mobile frame (max 440px).
 * Automatically hidden on screens where bottom navigation is inappropriate (e.g. Add Product, Edit Product).
 */
export function BottomNav() {
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Hide bottom navigation on Add Product and Edit Product screens
  const hideOnPaths = ['/products/add'];
  if (hideOnPaths.includes(location.pathname) || location.pathname.endsWith('/edit')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[440px] border-t border-line/80 bg-surface/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      aria-label="Mobile Bottom Navigation"
    >
      <ul className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={!item.matchPrefix}
                className={({ isActive }) =>
                  cn(
                    'group relative flex flex-col items-center justify-center py-1 text-[11px] font-medium transition-all duration-200 select-none min-h-[48px]',
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-subtle hover:text-ink'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'relative flex items-center justify-center rounded-full p-1.5 transition-all duration-200',
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 scale-105'
                          : 'group-hover:scale-105'
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
                      {item.showBadge && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 tracking-tight">{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 h-1 w-5 rounded-full bg-brand-600 dark:bg-brand-400" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
