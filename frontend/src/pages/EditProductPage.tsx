import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { getErrorMessage, invoiceApi, productsApi } from '../lib/api';
import type { Product } from '../types';
import { ProductForm, type ProductFormSubmit } from '../components/products/ProductForm';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await productsApi.get(id);
      setProduct(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load product for editing.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit: ProductFormSubmit = async (values, invoiceFile, setUploadProgress) => {
    if (!id) return;
    try {
      const updated = await productsApi.update(id, values);

      if (invoiceFile) {
        setUploadProgress(0);
        try {
          await invoiceApi.upload(id, invoiceFile, setUploadProgress);
        } catch (uploadError) {
          showToast({
            variant: 'warning',
            title: 'Product updated, but invoice upload failed',
            message: getErrorMessage(uploadError, 'You can retry from the product details.'),
          });
          navigate(`/products/${id}`, { replace: true });
          return;
        }
      }

      showToast({
        variant: 'success',
        title: 'Product updated',
        message: `${updated.name} changes were saved.`,
      });
      navigate(`/products/${id}`, { replace: true });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not update product',
        message: getErrorMessage(err, 'Please try again in a moment.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Top Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-subtle hover:text-ink active:scale-95 transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            Edit Product
          </h1>
          <p className="text-[11px] font-medium text-subtle">
            Update specifications and warranty
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : product ? (
        <ProductForm
          initial={product}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      ) : null}
    </div>
  );
}

export default EditProductPage;
