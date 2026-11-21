import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  Package,
  Plus,
  ArrowUpDown,
} from 'lucide-react';

import { getErrorMessage, productsApi } from '../lib/api';
import { cn } from '../lib/cn';
import { CATEGORIES_LIST } from '../lib/categories';
import type { Product, WarrantyStatus } from '../types';
import { ProductCard } from '../components/products/ProductCard';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

const STATUS_FILTERS: { value: WarrantyStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'purchase_date:desc', label: 'Newest purchases' },
  { value: 'warranty_end:asc', label: 'Expiring soonest' },
  { value: 'price:desc', label: 'Highest price' },
  { value: 'name:asc', label: 'Name (A–Z)' },
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') ?? '';
  const categoryParam = searchParams.get('category') ?? '';
  const statusParam = (searchParams.get('warranty_status') ?? '') as WarrantyStatus | '';
  const sortParam = searchParams.get('sort') || 'purchase_date';
  const orderParam = searchParams.get('order') || 'desc';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Sync search input
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounce search
  useEffect(() => {
    if (searchInput === searchParam) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set('search', searchInput.trim());
      else next.delete('search');
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, searchParam, searchParams, setSearchParams]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsApi.list({
        search: searchParam || undefined,
        category: categoryParam || undefined,
        warranty_status: statusParam || undefined,
        sort: sortParam as any,
        order: orderParam as any,
        page_size: 50,
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load products. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [searchParam, categoryParam, statusParam, sortParam, orderParam]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(searchParam || categoryParam || statusParam);

  return (
    <div className="space-y-4 pb-6">
      {/* 16. Header: My Products */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            My Products
          </h1>
          <p className="text-[11px] font-medium text-subtle">
            {total} {total === 1 ? 'item' : 'items'} registered
          </p>
        </div>

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95',
            hasActiveFilters
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
              : 'border-line bg-surface text-subtle hover:text-ink'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          placeholder="Search products, brands, models..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-2xl border border-line/80 bg-surface pl-10 pr-9 py-2.5 text-xs font-medium text-ink placeholder:text-subtle/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {STATUS_FILTERS.map((f) => {
          const active = statusParam === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter('warranty_status', f.value)}
              className={cn(
                'whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shrink-0',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-line/80 bg-surface text-subtle hover:border-brand-300 hover:text-ink'
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Horizontal Category Icons Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
        <button
          type="button"
          onClick={() => setFilter('category', '')}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1 text-[11px] font-medium shrink-0 transition-colors',
            !categoryParam
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 font-semibold'
              : 'border-line bg-surface text-subtle hover:text-ink'
          )}
        >
          <span>All Categories</span>
        </button>

        {CATEGORIES_LIST.map((cat) => {
          const Icon = cat.icon;
          const active = categoryParam.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setFilter('category', active ? '' : cat.name)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1 text-[11px] font-medium shrink-0 transition-colors',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 font-semibold'
                  : 'border-line bg-surface text-subtle hover:text-ink'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Expandable Filters & Sort Drawer/Sheet */}
      {showFiltersModal && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-md space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-brand-600" />
              Sort Products By
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-danger-600 dark:text-danger-400"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((opt) => {
              const [s, o] = opt.value.split(':');
              const active = sortParam === s && orderParam === o;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('sort', s);
                    next.set('order', o);
                    setSearchParams(next, { replace: true });
                  }}
                  className={cn(
                    'rounded-xl border p-2 text-left text-xs font-medium transition-colors',
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 font-semibold'
                      : 'border-line bg-surface text-subtle hover:bg-elevated'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Products List Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface/40 p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-subtle" />
          <h3 className="mt-3 text-sm font-bold text-ink">No products found</h3>
          <p className="mt-1 text-xs text-subtle">
            {hasActiveFilters
              ? 'Try adjusting your search query or status filter.'
              : 'Add your first product to start tracking warranties.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-3 text-xs font-bold text-brand-600 dark:text-brand-400 underline"
            >
              Clear filters
            </button>
          ) : (
            <a
              href="/products/add"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
}

export default ProductsPage;
