import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ThemePreference } from '../types';

const STORAGE_KEY = 'billnow_theme';

interface ThemeContextValue {
  /** The user's saved preference (may be "system"). */
  theme: ThemePreference;
  /** The theme actually rendered right now. */
  resolvedTheme: 'light' | 'dark';
  /** Update the preference and apply it immediately. */
  setTheme: (theme: ThemePreference, options?: { persist?: boolean }) => void;
  /** Toggle between light and dark (based on what is currently rendered). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyThemeClass(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(readStoredTheme()),
  );

  // Apply the resolved theme to <html> whenever it changes.
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme]);

  // React to OS-level theme changes while in "system" mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = media.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference, options?: { persist?: boolean }) => {
    setThemeState(next);
    if (options?.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolveTheme(readStoredTheme()) === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
