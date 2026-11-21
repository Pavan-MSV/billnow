import { cn } from '../../lib/cn';

/** Minimal inline BillNow logo (document + checkmark + verified badge). */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = 'billnow-logo-gradient';
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-8 w-8 shrink-0', className)}
      role="img"
      aria-label="BillNow logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
      <path
        d="M13.5 9h10.7a2 2 0 0 1 1.42.59l4.3 4.3A2 2 0 0 1 30.5 15.3V29a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z"
        fill="#fff"
        fillOpacity="0.96"
      />
      <path
        d="M24 9v4.2a1.6 1.6 0 0 0 1.6 1.6H30"
        fill="none"
        stroke="#4338CA"
        strokeOpacity="0.35"
        strokeWidth="1.6"
      />
      <path
        d="M15.5 21.5l2.6 2.6 5.4-5.6"
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.5" cy="28.5" r="7" fill="#059669" stroke="#fff" strokeWidth="2" />
      <path
        d="M25.6 28.7l2 1.9 3.9-4.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Hide the wordmark, showing only the mark. */
  markOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TEXT_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

const MARK_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

/** Full BillNow lockup: mark + wordmark + optional tagline. */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={MARK_SIZES[size]} />
      {!markOnly && (
        <span className={cn('font-bold tracking-tight text-ink', TEXT_SIZES[size])}>
          Bill<span className="text-brand-600 dark:text-brand-400">Now</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
