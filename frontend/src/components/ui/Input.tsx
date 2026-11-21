import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  leftIcon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, containerClassName, leftIcon, rightAddon, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {props.required && <span className="ml-0.5 text-danger-600 dark:text-danger-400">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink shadow-sm transition-colors',
            'placeholder:text-subtle/70',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
            'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-subtle',
            leftIcon && 'pl-9',
            rightAddon && 'pr-14',
            error ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/30' : 'border-line',
            className,
          )}
          {...props}
        />
        {rightAddon && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightAddon}</span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
