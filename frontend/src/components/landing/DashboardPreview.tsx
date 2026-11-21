import {
  Bell,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react';

import { PhoneFrame } from './PhoneFrame';
import { SectionHeading } from './SectionHeading';

const STATS = [
  { label: 'Products', value: '128', tone: 'text-ink' },
  { label: 'Active', value: '96', tone: 'text-success-600 dark:text-success-400' },
  { label: 'Expiring', value: '8', tone: 'text-warning-600 dark:text-warning-400' },
  { label: 'Expired', value: '24', tone: 'text-danger-600 dark:text-danger-400' },
];

const UPCOMING = [
  { name: 'LG Washing Machine', days: '28d', status: 'Soon', tone: 'bg-warning-500' },
  { name: 'Dell XPS 13', days: '61d', status: 'Active', tone: 'bg-success-600' },
  { name: 'Canon Printer', days: '7d', status: 'Soon', tone: 'bg-warning-500' },
];

const TABS = [
  { icon: LayoutDashboard, label: 'Home', active: true },
  { icon: Package, label: 'Products', active: false },
  { icon: Plus, label: 'Add', active: false },
  { icon: Bell, label: 'Alerts', active: false },
  { icon: Settings, label: 'Profile', active: false },
];

/**
 * Marketing mock of the BillNow mobile app in portrait, matching the real
 * bottom-nav shell rather than a desktop browser window.
 */
export function DashboardPreview() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Dashboard preview"
          title="Built for your pocket, not a spreadsheet"
          description="The same calm workspace on a phone: what you own, what’s about to expire, and a tap to add the next product."
        />

        <div className="mt-10 lg:mt-14">
          <PhoneFrame caption="Portrait app view · Home, products, alerts">
            <div className="flex min-h-[640px] flex-col bg-bg">
              {/* Status bar */}
              <div className="flex items-end justify-between px-6 pb-1 pt-3 text-[11px] font-semibold text-ink">
                <span>9:41</span>
                <span className="flex items-center gap-1 text-subtle">
                  <span className="h-1.5 w-3.5 rounded-sm bg-ink" />
                  <span className="h-2 w-4 rounded-sm border border-ink/70" />
                </span>
              </div>

              {/* App header */}
              <div className="flex items-center gap-2 px-4 pb-3 pt-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  B
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-subtle">Good evening</p>
                  <p className="truncate text-sm font-bold text-ink">Your collection</p>
                </div>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-subtle">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-600" />
                </span>
              </div>

              <div className="mx-4 flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-xs text-subtle">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                Search products…
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 px-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-line bg-surface p-3.5">
                    <p className="text-[11px] text-subtle">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-bold tracking-tight ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex-1 px-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Upcoming expirations</p>
                  <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">See all</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {UPCOMING.map((row) => (
                    <li
                      key={row.name}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${row.tone}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{row.name}</p>
                        <p className="text-[11px] text-subtle">{row.status}</p>
                      </div>
                      <span className="text-xs font-bold text-ink">{row.days}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-sm">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold">8 warranties need attention</span>
                </div>
              </div>

              {/* Bottom tab bar */}
              <nav className="mt-auto border-t border-line bg-surface/95 px-1 pb-5 pt-1.5">
                <ul className="flex items-stretch justify-between">
                  {TABS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label} className="flex-1">
                        <div
                          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${
                            item.active
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-subtle'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {item.label}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
