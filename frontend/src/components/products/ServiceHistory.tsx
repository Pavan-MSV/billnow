import { useState } from 'react';
import { CalendarClock, Pencil, Plus, Trash2, Wrench } from 'lucide-react';

import { getErrorMessage, servicesApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/format';
import type { ServiceRecord } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import { ServiceRecordDialog } from './ServiceRecordDialog';

interface ServiceHistoryProps {
  productId: string;
  currency: string;
  services: ServiceRecord[];
  onChanged: () => void;
}

/** Service history list with add / edit / delete actions. */
export function ServiceHistory({ productId, currency, services, onChanged }: ServiceHistoryProps) {
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (record: ServiceRecord) => {
    setEditing(record);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await servicesApi.remove(pendingDelete.id);
      showToast({ variant: 'success', title: 'Service record deleted' });
      setPendingDelete(null);
      onChanged();
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Unable to delete record',
        message: getErrorMessage(error, 'Please try again in a moment.'),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-subtle">
          {services.length === 0
            ? 'No service records yet.'
            : `${services.length} record${services.length === 1 ? '' : 's'}`}
        </p>
        <Button size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
          Add Service Record
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" aria-hidden="true" />}
          title="No service history"
          description="Log repairs, servicing and maintenance so you always have the full story."
          action={
            <Button size="sm" variant="outline" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
              Add Service Record
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {services.map((record) => (
            <li
              key={record.id}
              className="flex flex-col gap-3 rounded-lg border border-line bg-bg p-4 sm:flex-row sm:items-start"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-subtle">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-semibold text-ink">{record.service_type || 'Service'}</p>
                  <span className="text-sm text-subtle">· {formatDate(record.service_date)}</span>
                  {record.cost !== null && record.cost !== undefined && (
                    <span className="rounded-md bg-elevated px-1.5 py-0.5 text-xs font-medium text-subtle">
                      {formatCurrency(record.cost, currency)}
                    </span>
                  )}
                </div>
                {record.provider && <p className="mt-0.5 text-sm text-subtle">{record.provider}</p>}
                {record.description && <p className="mt-1.5 text-sm text-ink/80">{record.description}</p>}
                {record.next_service_date && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-subtle">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Next service: {formatDate(record.next_service_date)}
                  </p>
                )}
                {record.notes && <p className="mt-1.5 text-xs text-subtle">{record.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(record)}
                  aria-label="Edit service record"
                  className="rounded-lg p-2 text-subtle transition-colors hover:bg-elevated hover:text-ink"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(record)}
                  aria-label="Delete service record"
                  className="rounded-lg p-2 text-subtle transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-600/10 dark:hover:text-danger-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ServiceRecordDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        productId={productId}
        initial={editing}
        onSaved={onChanged}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete service record?"
        description="This record will be permanently removed. This cannot be undone."
        confirmLabel="Delete record"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}

export default ServiceHistory;
