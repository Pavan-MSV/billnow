import { LayoutDashboard, Bell, Package, PieChart, Plus, Settings, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Show the unread notification badge on this item. */
  showBadge?: boolean;
  /** Match nested routes (e.g. /products/:id) as active. */
  matchPrefix?: boolean;
}

export const SIDEBAR_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package, matchPrefix: true },
  { to: '/warranties', label: 'Warranties', icon: ShieldCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { to: '/insights', label: 'Insights', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package, matchPrefix: true },
  { to: '/products/add', label: 'Add', icon: Plus },
  { to: '/notifications', label: 'Alerts', icon: Bell, showBadge: true },
  { to: '/settings', label: 'Profile', icon: Settings },
];
