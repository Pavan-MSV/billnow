import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Consistent page title block used across protected pages. */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-subtle sm:mt-1.5">{description}</p>}
      </div>
      {action && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {action}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
