import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { cn } from '../../lib/cn';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
  variant?: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'variant' | 'title'>> {
  id: string;
  message?: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANTS: Record<ToastVariant, { icon: typeof Info; classes: string; iconClasses: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-success-200 dark:border-success-600/30',
    iconClasses: 'text-success-600 dark:text-success-400',
  },
  error: {
    icon: XCircle,
    classes: 'border-danger-200 dark:border-danger-600/30',
    iconClasses: 'text-danger-600 dark:text-danger-400',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-warning-200 dark:border-warning-500/30',
    iconClasses: 'text-warning-600 dark:text-warning-400',
  },
  info: {
    icon: Info,
    classes: 'border-brand-200 dark:border-brand-500/30',
    iconClasses: 'text-brand-600 dark:text-brand-400',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant = 'info', title, message, duration = 4500 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { id, variant, title, message, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((toast) => {
              const config = VARIANTS[toast.variant];
              const Icon = config.icon;
              return (
                <div
                  key={toast.id}
                  role="status"
                  className={cn(
                    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-pop animate-slide-up',
                    config.classes,
                  )}
                >
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClasses)} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{toast.title}</p>
                    {toast.message && <p className="mt-0.5 text-sm text-subtle">{toast.message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="-mr-1 -mt-1 rounded-md p-1 text-subtle transition-colors hover:bg-elevated hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export default ToastProvider;
