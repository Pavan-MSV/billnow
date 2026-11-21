import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CalendarClock, PieChart as PieIcon, TrendingUp, Wallet } from 'lucide-react';

import { getErrorMessage, insightsApi } from '../lib/api';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import { useTheme } from '../context/ThemeContext';
import type { Insights } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/Badge';

const PALETTE = [
  '#4F46E5',
  '#6366F1',
  '#818CF8',
  '#A5B4FC',
  '#0D9488',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#64748B',
];

const WARRANTY_COLORS: Record<string, string> = {
  Active: '#059669',
  'Expiring soon': '#F59E0B',
  Expired: '#DC2626',
};

export function InsightsPage() {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await insightsApi.get();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your insights. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartTheme = useMemo(
    () => ({
      axis: resolvedTheme === 'dark' ? '#94A3B8' : '#64748B',
      grid: resolvedTheme === 'dark' ? '#1E293B' : '#E2E8F0',
      tooltipBg: resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF',
      tooltipBorder: resolvedTheme === 'dark' ? '#1E293B' : '#E2E8F0',
      tooltipText: resolvedTheme === 'dark' ? '#F1F5F9' : '#0F172A',
    }),
    [resolvedTheme],
  );

  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    borderRadius: 12,
    fontSize: 12,
    color: chartTheme.tooltipText,
  };

  const warrantySplit = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Active', value: data.warranty_split.active },
      { name: 'Expiring soon', value: data.warranty_split.expiring_soon },
      { name: 'Expired', value: data.warranty_split.expired },
    ].filter((item) => item.value > 0);
  }, [data]);

  if (error) {
    return (
      <div>
        <PageHeader title="Insights" description="Understand your purchases and warranties." />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Insights" description="Understand your purchases and warranties." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasCategories = data.products_by_category.length > 0;
  const hasSpending = data.spending_by_category.length > 0;

  return (
    <div>
      <PageHeader title="Insights" description="Understand your purchases and warranties." />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-subtle">Total purchase value</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Wallet className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-ink">
              {formatCurrency(data.total_purchase_value, data.currency)}
            </p>
          </div>
          {[
            { label: 'Active', value: data.warranty_split.active, tone: 'text-success-600 dark:text-success-400' },
            { label: 'Expiring soon', value: data.warranty_split.expiring_soon, tone: 'text-warning-600 dark:text-warning-400' },
            { label: 'Expired', value: data.warranty_split.expired, tone: 'text-danger-600 dark:text-danger-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-line bg-surface p-5 shadow-card">
              <p className="text-sm font-medium text-subtle">{item.label} warranties</p>
              <p className={`mt-3 text-2xl font-bold tracking-tight ${item.tone}`}>
                {formatNumber(item.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Products by category */}
          <Card>
            <CardHeader
              title="Products by category"
              action={<PieIcon className="h-4 w-4 text-subtle" aria-hidden="true" />}
            />
            <div className="p-5">
              {!hasCategories ? (
                <EmptyState
                  className="border-0 bg-transparent py-10"
                  icon={<PieIcon className="h-6 w-6" aria-hidden="true" />}
                  title="No data yet"
                  description="Add products to see your category breakdown."
                />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.products_by_category}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {data.products_by_category.map((entry, index) => (
                          <Cell key={entry.category} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${formatNumber(value)} products`, '']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        formatter={(value) => <span style={{ color: chartTheme.axis, fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>

          {/* Active vs expired */}
          <Card>
            <CardHeader
              title="Warranty status split"
              action={<BarChart3 className="h-4 w-4 text-subtle" aria-hidden="true" />}
            />
            <div className="p-5">
              {warrantySplit.length === 0 ? (
                <EmptyState
                  className="border-0 bg-transparent py-10"
                  icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
                  title="No warranties tracked"
                  description="Add warranty details to see the split."
                />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warrantySplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {warrantySplit.map((entry) => (
                          <Cell key={entry.name} fill={WARRANTY_COLORS[entry.name] ?? '#64748B'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${formatNumber(value)} products`, '']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        formatter={(value) => <span style={{ color: chartTheme.axis, fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Spending by category */}
        <Card>
          <CardHeader
            title="Spending by category"
            action={<TrendingUp className="h-4 w-4 text-subtle" aria-hidden="true" />}
          />
          <div className="p-5">
            {!hasSpending ? (
              <EmptyState
                className="border-0 bg-transparent py-10"
                icon={<TrendingUp className="h-6 w-6" aria-hidden="true" />}
                title="No spending data yet"
                description="Add purchase prices to see where your money goes."
              />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.spending_by_category}
                    layout="vertical"
                    margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      stroke={chartTheme.grid}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={110}
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      stroke={chartTheme.grid}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: resolvedTheme === 'dark' ? '#1e293b55' : '#f1f5f9' }}
                      formatter={(value: number) => [formatCurrency(value, data.currency), 'Spend']}
                    />
                    <Bar dataKey="amount" fill="#4F46E5" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming expirations */}
        <Card>
          <CardHeader
            title="Upcoming warranty expirations"
            description="Products whose coverage is ending soon."
            action={<CalendarClock className="h-4 w-4 text-subtle" aria-hidden="true" />}
          />
          <div className="p-5">
            {data.upcoming_expirations.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-10"
                icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />}
                title="Nothing expiring soon"
                description="No warranties are ending in the near future."
              />
            ) : (
              <ul className="divide-y divide-line">
                {data.upcoming_expirations.map((item) => (
                  <li key={item.product_id}>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-elevated/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <p className="text-xs text-subtle">
                          {item.category || 'Uncategorised'} · Expires {formatDate(item.warranty_end_date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {item.days_remaining !== null && (
                          <span className="text-sm font-semibold text-ink">
                            {item.days_remaining}
                            <span className="ml-1 text-xs font-normal text-subtle">days</span>
                          </span>
                        )}
                        <StatusBadge status={item.warranty_status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default InsightsPage;
