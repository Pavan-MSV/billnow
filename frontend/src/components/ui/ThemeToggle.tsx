import { Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '../../lib/cn';
import { useTheme } from '../../context/ThemeContext';

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const LABELS = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
} as const;

/**
 * Cycles theme preference: light → dark → system. The icon shown reflects the
 * current preference (not the resolved theme) so the control is predictable.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme] ?? Monitor;
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${LABELS[theme]} (click for ${LABELS[next]})`}
      aria-label={`Change theme. Current: ${LABELS[theme]}`}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-subtle transition-colors hover:bg-elevated hover:text-ink',
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
