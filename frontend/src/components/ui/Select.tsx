import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, containerClassName, id, className, children, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
          {props.required && <span className="ml-0.5 text-danger-600 dark:text-danger-400">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border bg-surface pl-3 pr-9 text-sm text-ink shadow-sm transition-colors',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
            'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-subtle',
            error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/30' : 'border-line',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
