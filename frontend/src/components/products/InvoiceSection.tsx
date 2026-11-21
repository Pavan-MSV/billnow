import { useRef, useState, type ChangeEvent } from 'react';
import { Download, ExternalLink, FileText, RefreshCw, Trash2, Upload } from 'lucide-react';

import {
  ALLOWED_INVOICE_ACCEPT,
  ALLOWED_INVOICE_MIME_TYPES,
  MAX_INVOICE_SIZE_BYTES,
  MAX_INVOICE_SIZE_MB,
} from '../../lib/constants';
import { formatDateTime, formatFileSize } from '../../lib/format';
import { downloadInvoice, getErrorMessage, invoiceApi, openInvoiceInNewTab } from '../../lib/api';
import type { Product } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

type BusyAction = 'upload' | 'view' | 'download' | 'delete' | null;

interface InvoiceSectionProps {
  product: Product;
  /** Called after a successful upload/delete so the parent can refetch. */
  onChanged: () => void;
}

/** Invoice panel: upload, view, download, replace and delete. */
export function InvoiceSection({ product, onChanged }: InvoiceSectionProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoice = product.invoice;

  const upload = async (file: File) => {
    if (!ALLOWED_INVOICE_MIME_TYPES.includes(file.type as (typeof ALLOWED_INVOICE_MIME_TYPES)[number])) {
      showToast({ variant: 'error', title: 'Unsupported file', message: 'Please upload a PDF, JPG, JPEG or PNG file.' });
      return;
    }
    if (file.size > MAX_INVOICE_SIZE_BYTES) {
      showToast({ variant: 'error', title: 'File too large', message: `Maximum size is ${MAX_INVOICE_SIZE_MB} MB.` });
      return;
    }
    setBusy('upload');
    setProgress(0);
    try {
      await invoiceApi.upload(product.id, file, setProgress);
      showToast({ variant: 'success', title: invoice ? 'Invoice replaced' : 'Invoice uploaded' });
      onChanged();
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Upload failed',
        message: getErrorMessage(error, 'Unable to upload the invoice. Please check your connection and try again.'),
      });
    } finally {
      setBusy(null);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void upload(file);
  };

  const handleView = async () => {
    setBusy('view');
    try {
      await openInvoiceInNewTab(product.id);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Unable to open invoice',
        message: getErrorMessage(error, 'Please try again in a moment.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    setBusy('download');
    try {
      await downloadInvoice(product.id, invoice?.file_name);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Download failed',
        message: getErrorMessage(error, 'Please try again in a moment.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy('delete');
    try {
      await invoiceApi.remove(product.id);
      showToast({ variant: 'success', title: 'Invoice deleted' });
      setConfirmDelete(false);
      onChanged();
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Unable to delete invoice',
        message: getErrorMessage(error, 'Please try again in a moment.'),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_INVOICE_ACCEPT}
        className="sr-only"
        onChange={onFileChange}
      />

      {invoice ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-bg p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{invoice.file_name}</p>
              <p className="text-xs text-subtle">
                {formatFileSize(invoice.file_size)} · Uploaded {formatDateTime(invoice.uploaded_at)}
              </p>
            </div>
          </div>

          {busy === 'upload' && progress !== null && (
            <div>
              <div className="flex items-center justify-between text-xs text-subtle">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              loading={busy === 'view'}
              leftIcon={<ExternalLink className="h-4 w-4" />}
            >
              View Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              loading={busy === 'download'}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={busy !== null}
              className="text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-600/10"
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-bg px-4 py-8 text-center">
            <Upload className="h-6 w-6 text-subtle" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">No invoice attached yet</p>
            <p className="mt-0.5 text-xs text-subtle">PDF, JPG, JPEG or PNG · up to {MAX_INVOICE_SIZE_MB} MB</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              loading={busy === 'upload'}
            >
              Upload Invoice
            </Button>
          </div>

          {busy === 'upload' && progress !== null && (
            <div>
              <div className="flex items-center justify-between text-xs text-subtle">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this invoice?"
        description="The file will be permanently removed from this product. This cannot be undone."
        confirmLabel="Delete invoice"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={busy === 'delete'}
      />
    </div>
  );
}

export default InvoiceSection;
