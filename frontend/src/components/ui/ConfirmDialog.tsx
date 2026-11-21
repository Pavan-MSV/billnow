import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Button, type ButtonVariant } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: Extract<ButtonVariant, 'danger' | 'primary' | 'success'>;
}

/** Standard confirmation dialog for destructive or important actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      hideCloseButton
      footer={
        <>
          <Button variant="outline" className="w-full sm:w-auto" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="w-full sm:w-auto" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            variant === 'danger'
              ? 'bg-danger-100 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400'
              : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
          )}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <div className="mt-1 text-sm text-subtle">{description}</div>}
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
