import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
}

/** Shimmering placeholder used while data loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-elevated', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/5" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface p-5 shadow-card', className)}>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-6 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-6 flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export default Skeleton;
