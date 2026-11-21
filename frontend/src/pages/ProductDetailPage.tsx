import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Pencil,
  Receipt,
  Store,
  Trash2,
  Wrench,
} from 'lucide-react';

import { getErrorMessage, productsApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { getCategoryInfo } from '../lib/categories';
import type { Product } from '../types';
import { WarrantyStatusCard } from '../components/products/WarrantyStatusCard';
import { InvoiceSection } from '../components/products/InvoiceSection';
import { ServiceHistory } from '../components/products/ServiceHistory';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/cn';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await productsApi.get(id);
      setProduct(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load product details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await productsApi.remove(id);
      showToast({ variant: 'success', title: 'Product deleted' });
      navigate('/products', { replace: true });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Unable to delete product',
        message: getErrorMessage(err, 'Please try again in a moment.'),
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <ErrorState message={error || 'Product not found'} onRetry={loadProduct} />
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(product.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="space-y-4 pb-12">
      {/* 12. Mobile Header: Product Details */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-subtle hover:text-ink active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-ink">
              Product Details
            </h1>
            <p className="text-[11px] font-medium text-subtle">
              Specifications, warranty & service history
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit & Delete */}
        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/${product.id}/edit`}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-surface text-subtle hover:text-brand-600 active:scale-95 transition-all"
            aria-label="Edit product"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            aria-label="Delete product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Product Hero Banner */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm flex items-start gap-3.5">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border',
            categoryInfo.bgLight,
            categoryInfo.bgDark
          )}
        >
          <CategoryIcon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-md bg-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-subtle">
            {product.category || 'Product'}
          </span>
          <h2 className="mt-1 text-base font-extrabold text-ink tracking-tight truncate">
            {product.name}
          </h2>
          <p className="text-xs font-semibold text-subtle">
            {product.brand || 'Brand'}{' '}
            {product.model_number ? `· ${product.model_number}` : ''}
          </p>
        </div>
      </div>

      {/* 12. Warranty Status Card with Visual Progress */}
      <WarrantyStatusCard product={product} />

      {/* 12. Product Information Section */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          Product Information
        </h3>

        <div className="divide-y divide-line/60 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Brand</span>
            <span className="font-bold text-ink">{product.brand || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Model</span>
            <span className="font-bold text-ink">{product.model_number || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Serial Number</span>
            <span className="font-mono font-semibold text-ink bg-elevated px-1.5 py-0.5 rounded">
              {product.serial_number || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 12. Purchase Information Section */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" />
          Purchase Information
        </h3>

        <div className="divide-y divide-line/60 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Purchase Date</span>
            <span className="font-bold text-ink">{formatDate(product.purchase_date)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Purchase Price</span>
            <span className="font-black text-ink text-sm">
              {formatCurrency(product.purchase_price, product.currency || 'INR')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-subtle font-medium">Seller / Store</span>
            <span className="font-bold text-ink">{product.seller || '—'}</span>
          </div>
        </div>
      </div>

      {/* 13. Invoice Section */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          Invoice & Receipts
        </h3>
        <InvoiceSection product={product} onChanged={loadProduct} />
      </div>

      {/* 14. Service History Section */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" />
          Service History
        </h3>
        <ServiceHistory
          productId={product.id}
          currency={product.currency || 'INR'}
          services={product.services}
          onChanged={loadProduct}
        />
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${product.name}?`}
        description="This will permanently delete this product, all its warranty records, service logs, and stored invoices. This action cannot be undone."
        confirmLabel="Delete Product"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </div>
  );
}

export default ProductDetailPage;
