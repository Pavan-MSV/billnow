import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  FileText,
  Upload,
  X,
  IndianRupee,
  Store,
  ShieldCheck,
  Tag,
  Hash,
} from 'lucide-react';

import { cn } from '../../lib/cn';
import {
  ALLOWED_INVOICE_ACCEPT,
  ALLOWED_INVOICE_MIME_TYPES,
  DEFAULT_CURRENCY,
  MAX_INVOICE_SIZE_BYTES,
  MAX_INVOICE_SIZE_MB,
} from '../../lib/constants';
import { CATEGORIES_LIST } from '../../lib/categories';
import { formatFileSize, toISODate } from '../../lib/format';
import { computeWarrantyEndDate } from '../../lib/warranty';
import type { Product, ProductInput } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export type ProductFormSubmit = (
  values: ProductInput,
  invoiceFile: File | null,
  setUploadProgress: (percent: number) => void
) => Promise<void>;

interface ProductFormProps {
  initial?: Product;
  submitLabel?: string;
  onSubmit: ProductFormSubmit;
  onCancel?: () => void;
}

const WARRANTY_PRESETS = [6, 12, 24, 36, 60];

export function ProductForm({
  initial,
  submitLabel = 'Save Product',
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Mobile');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [modelNumber, setModelNumber] = useState(initial?.model_number ?? '');
  const [serialNumber, setSerialNumber] = useState(initial?.serial_number ?? '');

  const todayStr = toISODate(new Date());
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date ?? todayStr);
  const [purchasePrice, setPurchasePrice] = useState(
    initial?.purchase_price !== null && initial?.purchase_price !== undefined
      ? String(initial.purchase_price)
      : ''
  );
  const [seller, setSeller] = useState(initial?.seller ?? '');
  const [storeLocation, setStoreLocation] = useState('');

  const [warrantyPeriodMonths, setWarrantyPeriodMonths] = useState(
    initial?.warranty_period_months !== null && initial?.warranty_period_months !== undefined
      ? String(initial.warranty_period_months)
      : '12'
  );
  const [warrantyStartDate, setWarrantyStartDate] = useState(
    initial?.warranty_start_date ?? initial?.purchase_date ?? todayStr
  );
  const [warrantyEndDate, setWarrantyEndDate] = useState(initial?.warranty_end_date ?? '');
  const [autoCalculated, setAutoCalculated] = useState(!initial?.warranty_end_date);

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate end date when start date or months change
  useEffect(() => {
    if (!autoCalculated) return;
    const months = Number(warrantyPeriodMonths);
    if (months > 0 && warrantyStartDate) {
      const calculated = computeWarrantyEndDate(warrantyStartDate, null, months);
      if (calculated) setWarrantyEndDate(calculated);
    }
  }, [warrantyStartDate, warrantyPeriodMonths, autoCalculated]);

  // Keep start date in sync with purchase date initially if user hasn't explicitly customized
  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    if (!initial) {
      setWarrantyStartDate(val);
    }
  };

  const handleFile = (file: File | null) => {
    setInvoiceError('');
    if (!file) {
      setInvoiceFile(null);
      return;
    }

    if (
      !ALLOWED_INVOICE_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_INVOICE_MIME_TYPES)[number]
      )
    ) {
      setInvoiceError('Please upload a PDF, JPG, JPEG or PNG document.');
      return;
    }

    if (file.size > MAX_INVOICE_SIZE_BYTES) {
      setInvoiceError(`Invoice must be under ${MAX_INVOICE_SIZE_MB} MB.`);
      return;
    }

    setInvoiceFile(file);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Product name is required.';
    if (!category.trim()) next.category = 'Please choose a category.';
    if (!purchaseDate) next.purchase_date = 'Purchase date is required.';
    if (purchasePrice && Number.isNaN(Number(purchasePrice))) {
      next.purchase_price = 'Enter a valid numeric price.';
    }
    if (warrantyPeriodMonths && Number.isNaN(Number(warrantyPeriodMonths))) {
      next.warranty_period_months = 'Months must be a number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const parsedPrice = purchasePrice ? Number(purchasePrice) : null;
      const parsedMonths = warrantyPeriodMonths ? parseInt(warrantyPeriodMonths, 10) : null;

      // Combine seller and store location if provided
      let sellerValue = seller.trim();
      if (storeLocation.trim()) {
        sellerValue = sellerValue ? `${sellerValue} (${storeLocation.trim()})` : storeLocation.trim();
      }

      const payload: ProductInput = {
        name: name.trim(),
        category: category.trim(),
        brand: brand.trim() || null,
        model_number: modelNumber.trim() || null,
        serial_number: serialNumber.trim() || null,
        purchase_date: purchaseDate || null,
        purchase_price: parsedPrice,
        currency: DEFAULT_CURRENCY,
        seller: sellerValue || null,
        warranty_start_date: warrantyStartDate || null,
        warranty_period_months: parsedMonths,
        warranty_end_date: warrantyEndDate || null,
      };

      await onSubmit(payload, invoiceFile, setUploadProgress);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 pb-20">
      {/* 11. Category Picker Section */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-subtle flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-brand-600" />
          Product Category
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORIES_LIST.map((c) => {
            const Icon = c.icon;
            const isSelected = category.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all active:scale-95 select-none',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/30 dark:bg-brand-500/20 dark:text-brand-300'
                    : 'border-line bg-surface text-subtle hover:border-brand-300 hover:text-ink'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl mb-1.5 transition-colors',
                    isSelected ? 'bg-brand-600 text-white' : 'bg-elevated text-subtle'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10. Product Information Section */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Product Information
        </h2>

        <Input
          label="Product Name"
          placeholder="e.g. Samsung Refrigerator"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Brand"
            placeholder="e.g. Samsung"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Input
            label="Model Number"
            placeholder="e.g. RF28T5001"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
          />
        </div>

        <Input
          label="Serial Number"
          placeholder="e.g. XXXXXX12345"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          leftIcon={<Hash className="h-3.5 w-3.5" />}
        />
      </div>

      {/* 10. Purchase Information Section */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Purchase Information
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => handlePurchaseDateChange(e.target.value)}
            error={errors.purchase_date}
            required
          />
          <Input
            label="Purchase Price (₹)"
            type="number"
            step="0.01"
            placeholder="65000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            error={errors.purchase_price}
            leftIcon={<IndianRupee className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Seller / Store"
            placeholder="e.g. ABC Electronics"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            leftIcon={<Store className="h-3.5 w-3.5" />}
          />
          <Input
            label="Store Location"
            placeholder="e.g. Bangalore"
            value={storeLocation}
            onChange={(e) => setStoreLocation(e.target.value)}
          />
        </div>
      </div>

      {/* 10. Warranty Section */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Warranty Details
          </h2>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Auto-calculated
          </span>
        </div>

        {/* Quick Warranty Period Presets */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Warranty Period (Months)
          </label>
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
            {WARRANTY_PRESETS.map((p) => {
              const active = warrantyPeriodMonths === String(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setWarrantyPeriodMonths(String(p));
                    setAutoCalculated(true);
                  }}
                  className={cn(
                    'rounded-xl px-2.5 py-1 text-xs font-bold transition-all shrink-0',
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-line bg-elevated text-subtle hover:text-ink'
                  )}
                >
                  {p}m {p >= 12 ? `(${p / 12}y)` : ''}
                </button>
              );
            })}
          </div>
          <Input
            type="number"
            placeholder="12"
            value={warrantyPeriodMonths}
            onChange={(e) => {
              setWarrantyPeriodMonths(e.target.value);
              setAutoCalculated(true);
            }}
            error={errors.warranty_period_months}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Warranty Start"
            type="date"
            value={warrantyStartDate}
            onChange={(e) => {
              setWarrantyStartDate(e.target.value);
              setAutoCalculated(true);
            }}
          />
          <Input
            label="Warranty Expiry"
            type="date"
            value={warrantyEndDate}
            onChange={(e) => {
              setWarrantyEndDate(e.target.value);
              setAutoCalculated(false);
            }}
          />
        </div>
      </div>

      {/* 10. Invoice Upload Section (Storage only, NO OCR) */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Upload Invoice
          </label>
          <span className="text-[10px] text-subtle font-medium">PDF, JPG, PNG up to 10MB</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_INVOICE_ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {invoiceFile ? (
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-500/20 dark:bg-brand-500/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{invoiceFile.name}</p>
                <p className="text-[11px] text-subtle">{formatFileSize(invoiceFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFile(null)}
              className="rounded-lg p-1 text-subtle hover:bg-white hover:text-danger-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-elevated/40 p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/30 active:scale-[0.99]"
          >
            <Upload className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span className="mt-2 text-xs font-bold text-ink">
              Tap to choose invoice or photo
            </span>
            <span className="mt-0.5 text-[11px] text-subtle">
              Stored securely for future reference (no OCR)
            </span>
          </button>
        )}

        {invoiceError && (
          <p className="text-xs font-semibold text-danger-600 dark:text-danger-400">
            {invoiceError}
          </p>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-600 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Form Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-line bg-surface py-3 text-xs font-bold text-subtle hover:text-ink active:scale-95 transition-all"
          >
            Cancel
          </button>
        )}
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          className="h-12 flex-1 text-xs font-bold shadow-lg shadow-brand-600/25 active:scale-95"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
