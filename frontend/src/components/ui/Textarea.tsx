import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, containerClassName, id, className, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="field-label">
          {label}
          {props.required && <span className="ml-0.5 text-danger-600 dark:text-danger-400">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors',
          'placeholder:text-subtle/70',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-subtle',
          error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/30' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
