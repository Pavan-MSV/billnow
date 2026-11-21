import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/cn';
import { APP_TAGLINE } from '../../lib/constants';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export function SplashScreen({ onComplete, durationMs = 2600 }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, durationMs - 400);

    const finishTimer = setTimeout(() => {
      onComplete?.();
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 250);
  };

  return (
    <div
      onClick={handleSkip}
      className={cn(
        'fixed inset-0 z-50 flex cursor-pointer select-none flex-col items-center justify-between overflow-hidden',
        'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 px-6 py-12 text-white transition-opacity duration-500',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      role="banner"
      aria-label="BillNow Splash Screen"
    >
      {/* Background glow effects */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top spacer / subtle brand pill */}
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 transition-colors backdrop-blur-sm"
        >
          Skip
        </button>
      </div>

      {/* Center animated logo sequence */}
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated BillNow Mark */}
        <div className="relative mb-6 animate-splash-logo">
          {/* Subtle pulse aura */}
          <div className="absolute -inset-4 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse" />

          {/* BillNow SVG Logo Mark */}
          <svg
            viewBox="0 0 72 72"
            className="relative h-24 w-24 drop-shadow-[0_12px_24px_rgba(79,70,229,0.35)]"
            role="img"
            aria-label="BillNow Logo"
          >
            <defs>
              <linearGradient id="bnSplashGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#4338CA" />
              </linearGradient>
            </defs>
            <rect width="72" height="72" rx="20" fill="url(#bnSplashGrad)" />
            {/* Document sheet */}
            <path
              d="M24 16h20a3.5 3.5 0 0 1 2.5 1l7.5 7.5a3.5 3.5 0 0 1 1 2.5V52a3.5 3.5 0 0 1-3.5 3.5h-27.5A3.5 3.5 0 0 1 20.5 52V19.5A3.5 3.5 0 0 1 24 16Z"
              fill="#ffffff"
              fillOpacity="0.96"
            />
            {/* Document fold line */}
            <path
              d="M44 16v7.5A2.5 2.5 0 0 0 46.5 26H54"
              fill="none"
              stroke="#4338CA"
              strokeOpacity="0.35"
              strokeWidth="2.8"
            />
            {/* Checkmark inside document */}
            <path
              d="M28 38l5 5 11-11"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shield / Verified badge on corner */}
            <circle cx="51" cy="51" r="12" fill="#059669" stroke="#ffffff" strokeWidth="3" className="animate-splash-badge" />
            <path
              d="M46 51.5l3.5 3.5 7-7.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-splash-badge"
            />
          </svg>
        </div>

        {/* Brand Name */}
        <div className="animate-splash-text flex items-center gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            Bill<span className="text-indigo-400">Now</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-3 max-w-[280px] text-sm font-medium text-slate-300 animate-splash-tagline">
          “{APP_TAGLINE}”
        </p>

        {/* Trust badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 animate-splash-tagline">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Smart Warranty & Invoice Vault</span>
        </div>
      </div>

      {/* Bottom loading indicator */}
      <div className="flex w-full flex-col items-center gap-3">
        <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-[2400ms] ease-out"
            style={{ width: exiting ? '100%' : '80%' }}
          />
        </div>
        <p className="text-[11px] font-medium text-slate-500 tracking-wider uppercase">
          Initializing secure storage...
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;
