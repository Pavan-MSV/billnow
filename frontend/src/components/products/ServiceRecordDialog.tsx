import { useEffect, useState, type FormEvent } from 'react';

import { getErrorMessage, servicesApi } from '../../lib/api';
import type { ServiceRecord, ServiceRecordInput } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { ErrorState } from '../ui/ErrorState';
import { useToast } from '../ui/Toast';

interface ServiceRecordDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  initial?: ServiceRecord | null;
  onSaved: () => void;
}

interface FormState {
  service_date: string;
  service_type: string;
  provider: string;
  cost: string;
  description: string;
  next_service_date: string;
  notes: string;
}

const EMPTY: FormState = {
  service_date: '',
  service_type: '',
  provider: '',
  cost: '',
  description: '',
  next_service_date: '',
  notes: '',
};

/** Modal dialog to add or edit a service record. */
export function ServiceRecordDialog({
  open,
  onClose,
  productId,
  initial,
  onSaved,
}: ServiceRecordDialogProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            service_date: initial.service_date ?? '',
            service_type: initial.service_type ?? '',
            provider: initial.provider ?? '',
            cost: initial.cost !== null && initial.cost !== undefined ? String(initial.cost) : '',
            description: initial.description ?? '',
            next_service_date: initial.next_service_date ?? '',
            notes: initial.notes ?? '',
          }
        : EMPTY,
    );
    setErrors({});
    setFormError('');
  }, [open, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.service_date) next.service_date = 'Service date is required.';
    if (form.cost.trim()) {
      const cost = Number(form.cost);
      if (Number.isNaN(cost)) next.cost = 'Enter a valid cost.';
      else if (cost < 0) next.cost = 'Cost cannot be negative.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    const payload: ServiceRecordInput = {
      service_date: form.service_date || null,
      service_type: form.service_type.trim() || null,
      provider: form.provider.trim() || null,
      cost: form.cost.trim() ? Number(form.cost) : null,
      description: form.description.trim() || null,
      next_service_date: form.next_service_date || null,
      notes: form.notes.trim() || null,
    };
    setSaving(true);
    try {
      if (initial) {
        await servicesApi.update(initial.id, payload);
        showToast({ variant: 'success', title: 'Service record updated' });
      } else {
        await servicesApi.create(productId, payload);
        showToast({ variant: 'success', title: 'Service record added' });
      }
      onSaved();
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save the service record. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit service record' : 'Add service record'}
      description="Keep track of repairs, servicing and maintenance."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="service-form" loading={saving}>
            {initial ? 'Save changes' : 'Add record'}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <ErrorState title="Could not save" message={formError} className="py-6" />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Service date"
            type="date"
            value={form.service_date}
            onChange={(event) => setField('service_date', event.target.value)}
            error={errors.service_date}
            required
          />
          <Input
            label="Service type"
            placeholder="e.g. Repair, Maintenance"
            value={form.service_type}
            onChange={(event) => setField('service_type', event.target.value)}
          />
          <Input
            label="Service provider"
            placeholder="e.g. Authorised Service Centre"
            value={form.provider}
            onChange={(event) => setField('provider', event.target.value)}
          />
          <Input
            label="Cost"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.cost}
            onChange={(event) => setField('cost', event.target.value)}
            error={errors.cost}
          />
          <Input
            label="Next service date"
            type="date"
            value={form.next_service_date}
            onChange={(event) => setField('next_service_date', event.target.value)}
          />
        </div>
        <Textarea
          label="Description"
          placeholder="What was done?"
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Any additional notes"
          value={form.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />
      </form>
    </Modal>
  );
}

export default ServiceRecordDialog;
