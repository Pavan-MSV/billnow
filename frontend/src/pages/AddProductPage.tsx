import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { getErrorMessage, invoiceApi, productsApi } from '../lib/api';
import { ProductForm, type ProductFormSubmit } from '../components/products/ProductForm';
import { useToast } from '../components/ui/Toast';

export function AddProductPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit: ProductFormSubmit = async (values, invoiceFile, setUploadProgress) => {
    try {
      const product = await productsApi.create(values);

      if (invoiceFile) {
        setUploadProgress(0);
        try {
          await invoiceApi.upload(product.id, invoiceFile, setUploadProgress);
        } catch (uploadError) {
          showToast({
            variant: 'warning',
            title: 'Product saved, but the invoice failed to upload',
            message: getErrorMessage(uploadError, 'You can add the invoice from the product details.'),
          });
          navigate(`/products/${product.id}`, { replace: true });
          return;
        }
      }

      showToast({
        variant: 'success',
        title: 'Product added successfully!',
        message: `${product.name} is now protected and tracked.`,
      });
      navigate(`/products/${product.id}`, { replace: true });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Product could not be saved',
        message: getErrorMessage(error, 'Please check your information and try again.'),
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
            Add Product
          </h1>
          <p className="text-[11px] font-medium text-subtle">
            Save purchase, warranty and invoice info
          </p>
        </div>
      </div>

      <ProductForm
        submitLabel="Add Product"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}

export default AddProductPage;
