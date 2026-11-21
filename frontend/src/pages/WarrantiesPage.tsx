import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';

import { getErrorMessage, warrantiesApi } from '../lib/api';
import { cn } from '../lib/cn';
import { formatCurrency, formatDate } from '../lib/format';
import { getWarrantyMeta, resolveDaysRemaining } from '../lib/warranty';
import type { WarrantyCounts, WarrantyListItem, WarrantyStatus } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';

type TabKey = 'active' | 'expiring_soon' | 'expired';

const TABS: { key: TabKey; label: string; tone: string }[] = [
  { key: 'active', label: 'Active', tone: 'text-success-600 dark:text-success-400' },
  { key: 'expiring_soon', label: 'Expiring Soon', tone: 'text-warning-600 dark:text-warning-400' },
  { key: 'expired', label: 'Expired', tone: 'text-danger-600 dark:text-danger-400' },
];

const EMPTY_COUNTS: WarrantyCounts = { active: 0, expiring_soon: 0, expired: 0 };

export function WarrantiesPage() {
  const [items, setItems] = useState<WarrantyListItem[]>([]);
  const [counts, setCounts] = useState<WarrantyCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('active');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await warrantiesApi.list();
      setItems(data.items);
      setCounts(data.counts ?? EMPTY_COUNTS);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your warranties. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => items.filter((item) => item.warranty_status === (tab as WarrantyStatus)),
    [items, tab],
  );

  return (
    <div>
      <PageHeader
        title="Warranties"
        description="Track coverage across all your products."
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Warranty status" className="mb-6 -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:flex-wrap sm:gap-2 sm:px-0">
        {TABS.map((item) => {
          const active = tab === item.key;
          const count = counts[item.key] ?? 0;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4',
                active
                  ? 'border-brand-600 text-ink'
                  : 'border-transparent text-subtle hover:text-ink',
              )}
            >
              <span className={cn(active && item.tone)}>{item.label}</span>
              <span
                className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-elevated text-subtle',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
          title={`No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} warranties`}
          description="Warranties matching this status will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const meta = getWarrantyMeta(item.warranty_status);
            const days = resolveDaysRemaining(item.warranty_days_remaining, item.warranty_end_date);
            return (
              <li key={item.product_id}>
                <Link
                  to={`/products/${item.product_id}`}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-ink">{item.name}</p>
                      <StatusBadge status={item.warranty_status} />
                    </div>
                    <p className="mt-0.5 text-sm text-subtle">
                      {[item.category, item.brand].filter(Boolean).join(' · ') || 'Uncategorised'}
                    </p>
                    <p className="mt-1 text-sm text-subtle">
                      {meta.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(item.warranty_end_date)}
                      {days !== null && (
                        <span className="text-subtle/80">
                          {' '}
                          · {meta.status === 'expired' ? `${Math.abs(days)} days ago` : `${days} days left`}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-semibold text-ink">
                      {formatCurrency(item.purchase_price, item.currency || 'INR')}
                    </p>
                    <ChevronRight className="h-4 w-4 text-subtle" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default WarrantiesPage;
