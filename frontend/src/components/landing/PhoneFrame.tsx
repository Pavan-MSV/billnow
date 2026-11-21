import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Optional label shown under the device. */
  caption?: string;
}

/** Portrait phone bezel used for marketing mockups. */
export function PhoneFrame({ children, className, caption }: PhoneFrameProps) {
  return (
    <figure className={cn('mx-auto w-full max-w-[340px]', className)}>
      <div className="relative mx-auto rounded-[2.75rem] bg-slate-900 p-[10px] shadow-pop ring-1 ring-white/10">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[18px] z-20 h-[22px] w-[96px] -translate-x-1/2 rounded-full bg-black"
        />
        <div className="relative overflow-hidden rounded-[2.15rem] bg-bg">{children}</div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/25"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-center text-sm text-subtle">{caption}</figcaption>
      )}
    </figure>
  );
}

export default PhoneFrame;
