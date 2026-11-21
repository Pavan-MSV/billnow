import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base text-subtle sm:mt-4 sm:text-lg">{description}</p>}
    </div>
  );
}

export default SectionHeading;
