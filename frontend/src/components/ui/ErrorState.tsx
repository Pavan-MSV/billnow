import { AlertTriangle, RotateCw, WifiOff } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Show the offline-style icon instead of a generic warning. */
  offline?: boolean;
  className?: string;
}

/** Friendly inline error — never exposes stack traces. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  offline = false,
  className,
}: ErrorStateProps) {
  const Icon = offline ? WifiOff : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50/50 px-6 py-12 text-center dark:border-danger-600/30 dark:bg-danger-600/5',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-subtle">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={onRetry}
          leftIcon={<RotateCw className="h-4 w-4" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
