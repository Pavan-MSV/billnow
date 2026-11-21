import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency, formatDate } from '../../lib/format';
import { getWarrantyMeta, resolveDaysRemaining } from '../../lib/warranty';
import { getCategoryInfo } from '../../lib/categories';
import type { Product } from '../../types';
import { StatusBadge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Mobile-First Product Card matching BillNow Prompt specifications:
 * Product icon, Name, Brand, Model, Purchased Date, Warranty status & remaining time.
 * Whole card is comfortably tappable.
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const meta = getWarrantyMeta(product.warranty_status);
  const days = resolveDaysRemaining(product.warranty_days_remaining, product.warranty_end_date);
  const categoryInfo = getCategoryInfo(product.category);
  const CategoryIcon = categoryInfo.icon;

  // Format remaining warranty phrase as specified in prompt:
  // e.g. "Active — 8 months remaining" or "Expiring Soon — 18 days remaining" or "Expired"
  let warrantyPhrase = '';
  if (meta.status === 'expired') {
    const ago = days !== null ? Math.abs(days) : null;
    if (ago !== null && ago > 30) {
      const months = Math.floor(ago / 30);
      warrantyPhrase = `Expired — ${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else if (ago !== null) {
      warrantyPhrase = `Expired — ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
    } else {
      warrantyPhrase = 'Expired';
    }
  } else if (meta.status === 'expiring_soon') {
    if (days !== null) {
      warrantyPhrase = `Expiring Soon — ${days} ${days === 1 ? 'day' : 'days'} remaining`;
    } else {
      warrantyPhrase = 'Expiring Soon';
    }
  } else if (meta.status === 'active') {
    if (days !== null && days >= 60) {
      const months = Math.round(days / 30);
      warrantyPhrase = `Active — ${months} months remaining`;
    } else if (days !== null) {
      warrantyPhrase = `Active — ${days} days remaining`;
    } else {
      warrantyPhrase = 'Active';
    }
  } else {
    warrantyPhrase = 'Warranty Unknown';
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        'group relative block rounded-2xl border border-line/80 bg-surface p-4 shadow-sm transition-all duration-200 active:scale-[0.98] hover:border-brand-500/40 hover:shadow-md select-none',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Category Icon Badge */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105',
            categoryInfo.bgLight,
            categoryInfo.bgDark
          )}
        >
          <CategoryIcon className="h-6 w-6" />
        </div>

        {/* Product Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="truncate text-[15px] font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {product.name}
            </h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-subtle/70 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
          </div>

          {/* Brand & Model */}
          <p className="mt-0.5 truncate text-xs font-medium text-subtle">
            {product.brand || 'Brand'}{' '}
            {product.model_number ? `· Model: ${product.model_number}` : ''}
          </p>

          {/* Purchase Date & Price */}
          <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-subtle">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Purchased: {formatDate(product.purchase_date)}</span>
            </div>
            {product.purchase_price !== null && (
              <span className="font-semibold text-ink">
                {formatCurrency(product.purchase_price, product.currency || 'INR')}
              </span>
            )}
          </div>

          {/* Warranty Line with Status Badge */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/50 pt-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-subtle/80">
                Warranty
              </p>
              <p
                className={cn(
                  'truncate text-xs font-semibold mt-0.5',
                  meta.status === 'active' && 'text-emerald-600 dark:text-emerald-400',
                  meta.status === 'expiring_soon' && 'text-amber-600 dark:text-amber-400',
                  meta.status === 'expired' && 'text-rose-600 dark:text-rose-400',
                  meta.status === 'unknown' && 'text-subtle'
                )}
              >
                {warrantyPhrase}
              </p>
            </div>
            <StatusBadge status={product.warranty_status} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
