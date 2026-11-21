/** Formatting helpers: currency (INR), dates, file sizes, relative time. */

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Parse an ISO date/datetime string into a Date (local, midnight for date-only).
 */
export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Serialize a Date to an ISO date-only string (`YYYY-MM-DD`). */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** "11 Nov 2028" (or "—" when invalid/missing). */
export function formatDate(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "11 Nov 2028, 10:30 AM" for timestamps. */
export function formatDateTime(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '—';
  return `${formatDate(value)}, ${date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

/** Currency formatting using the en-IN locale (e.g. "₹1,23,456"). */
export function formatCurrency(value?: number | null, currency: string = 'INR'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || 'INR'} ${formatNumber(value)}`;
  }
}

/** Plain grouped number. */
export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}

/** "1.4 MB" */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  const rounded = size >= 10 || exponent === 0 ? Math.round(size) : Math.round(size * 10) / 10;
  return `${rounded} ${units[exponent]}`;
}

/** "5 days ago" / "in 3 days" / "2 hours ago". */
export function formatRelative(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '';
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(Math.round(diffMonth / 12), 'year');
}

/** Integer days between two dates (b - a). */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / msPerDay);
}

/** Whole days from today until the given date (negative when in the past). */
export function daysUntil(value?: string | null): number | null {
  const date = parseDate(value);
  if (!date) return null;
  return daysBetween(new Date(), date);
}

/** "1 product" / "3 products" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

/** Initials for an avatar fallback, e.g. "Ada Lovelace" -> "AL". */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
