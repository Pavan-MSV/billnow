import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  User,
  CheckCircle2,
} from 'lucide-react';

import { dashboardApi, getErrorMessage, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Logo } from '../components/ui/Logo';
import { ProductCard } from '../components/products/ProductCard';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import type { DashboardSummary, Product } from '../types';
import { resolveDaysRemaining } from '../lib/warranty';

export function DashboardPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, productRes] = await Promise.all([
        dashboardApi.summary(),
        productsApi.list({ page_size: 8, sort: 'purchase_date', order: 'desc' }),
      ]);
      setSummary(summaryData);
      setProducts(productRes.items);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load dashboard data. Please pull down to refresh.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Extract alerts: products expiring soon (priority) or active highlights
  const expiringAlerts = products.filter((p) => p.warranty_status === 'expiring_soon');
  const activeAlerts = products.filter((p) => p.warranty_status === 'active').slice(0, 2);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Pavan';

  return (
    <div className="space-y-5 pb-6">
      {/* 5. Mobile Header */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Logo markOnly size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold tracking-tight text-ink">
                Hello, {firstName} 👋
              </h1>
            </div>
            <p className="text-[11px] font-medium text-subtle">
              Keep your products and warranties organized.
            </p>
          </div>
        </div>

        {/* Header Action Buttons (Notification Bell + Account Avatar) */}
        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-subtle hover:text-ink transition-colors active:scale-95"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-xs text-white shadow-sm active:scale-95 transition-transform"
            aria-label="Account Settings"
          >
            {user?.name ? user.name.slice(0, 1).toUpperCase() : <User className="h-4 w-4" />}
          </Link>
        </div>
      </header>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          {/* 6. Warranty Summary Section (Compact 2x2 Mobile Cards) */}
          <section aria-label="Warranty Summary">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Products */}
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-3 text-left shadow-sm active:scale-95 transition-all hover:border-brand-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-subtle">Total Products</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <Package className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black tracking-tight text-ink">
                    {summary?.total_products ?? products.length}
                  </span>
                  <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                    View all →
                  </span>
                </div>
              </button>

              {/* Active Warranties */}
              <button
                type="button"
                onClick={() => navigate('/products?warranty_status=active')}
                className="flex flex-col justify-between rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-left shadow-sm active:scale-95 transition-all dark:border-emerald-500/20 dark:bg-emerald-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Active Warranties
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                    {summary?.active_warranties ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Covered
                  </span>
                </div>
              </button>

              {/* Expiring Soon */}
              <button
                type="button"
                onClick={() => navigate('/products?warranty_status=expiring_soon')}
                className="flex flex-col justify-between rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3 text-left shadow-sm active:scale-95 transition-all dark:border-amber-500/25 dark:bg-amber-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Expiring Soon
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                    {summary?.expiring_soon ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Action due
                  </span>
                </div>
              </button>

              {/* Expired */}
              <button
                type="button"
                onClick={() => navigate('/products?warranty_status=expired')}
                className="flex flex-col justify-between rounded-2xl border border-rose-200/60 bg-rose-50/50 p-3 text-left shadow-sm active:scale-95 transition-all dark:border-rose-500/20 dark:bg-rose-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                    Expired
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                    <ShieldX className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black tracking-tight text-rose-700 dark:text-rose-400">
                    {summary?.expired ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Out of coverage
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* 7. Important Warranty Alerts Section */}
          <section aria-label="Warranty Alerts" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-subtle">
                  Warranty Alerts
                </h2>
              </div>
              <Link
                to="/notifications"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View all alerts
              </Link>
            </div>

            {/* Alert Cards Container */}
            <div className="space-y-2.5">
              {/* If there are products expiring soon, show prominent alert card */}
              {expiringAlerts.length > 0 ? (
                expiringAlerts.slice(0, 2).map((item) => {
                  const daysLeft = resolveDaysRemaining(item.warranty_days_remaining, item.warranty_end_date);
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 shadow-sm dark:border-amber-500/30 dark:from-amber-950/30 dark:to-orange-950/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm mt-0.5">
                            <TriangleAlert className="h-4 w-4" />
                          </span>
                          <div>
                            <span className="inline-block rounded-md bg-amber-200/80 dark:bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                              ⚠️ Warranty Expiring Soon
                            </span>
                            <h3 className="mt-1 text-sm font-bold text-ink">
                              {item.name}
                            </h3>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                              Warranty expires in:{' '}
                              <strong className="font-bold underline">
                                {daysLeft !== null ? `${daysLeft} days` : 'soon'}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/products/${item.id}`}
                          className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : null}

              {/* Also show active warranty indicator card (LG Washing Machine or active sample) */}
              {activeAlerts.map((item) => {
                const daysLeft = resolveDaysRemaining(item.warranty_days_remaining, item.warranty_end_date);
                const monthsLeft = daysLeft ? Math.round(daysLeft / 30) : null;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          ✓ Warranty Active
                        </span>
                        <h4 className="truncate text-xs font-bold text-ink">
                          {item.name}
                        </h4>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {monthsLeft ? `${monthsLeft} months remaining` : `${daysLeft ?? '—'} days remaining`}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/products/${item.id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-0.5 active:scale-95"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. Products Section: My Products */}
          <section aria-label="My Products" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-ink">
                  My Products
                </h2>
                <p className="text-[11px] text-subtle">
                  Tap any product to view warranty & invoices
                </p>
              </div>
              <Link
                to="/products"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-0.5"
              >
                <span>All Products</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Product Cards List */}
            {products.length === 0 ? (
              /* 36. Empty States */
              <div className="rounded-2xl border-2 border-dashed border-line bg-surface/50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Package className="h-7 w-7" />
                </div>
                <h3 className="mt-3 text-base font-bold text-ink">No products yet</h3>
                <p className="mt-1 text-xs text-subtle max-w-[260px] mx-auto leading-relaxed">
                  Add your first product and never forget its warranty again.
                </p>
                <Link
                  to="/products/add"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Product</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 9. Floating Action Button: + Add Product */}
      <FloatingActionButton />
    </div>
  );
}

export default DashboardPage;
