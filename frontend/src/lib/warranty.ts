/**
 * Warranty helpers: status colours/labels and date maths.
 *
 * Accessibility note: status is NEVER communicated by colour alone — every
 * status also has a text label (and often an icon) alongside it.
 */

import type { WarrantyStatus } from '../types';
import { WARRANTY_EXPIRING_SOON_DAYS } from './constants';
import { daysUntil, formatDate, parseDate, toISODate } from './format';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';

export interface WarrantyMeta {
  /** Raw status value from the API. */
  status: WarrantyStatus;
  /** Human readable label, e.g. "Active". */
  label: string;
  /** Short uppercase label used on prominent cards. */
  shortLabel: string;
  tone: StatusTone;
  /** Friendly one-liner description. */
  description: string;
}

const META: Record<WarrantyStatus, Omit<WarrantyMeta, 'status'>> = {
  active: {
    label: 'Active',
    shortLabel: 'ACTIVE',
    tone: 'success',
    description: 'Your warranty is valid and covers this product.',
  },
  expiring_soon: {
    label: 'Expiring soon',
    shortLabel: 'EXPIRING SOON',
    tone: 'warning',
    description: 'The warranty on this product is about to end.',
  },
  expired: {
    label: 'Expired',
    shortLabel: 'EXPIRED',
    tone: 'danger',
    description: 'The warranty period for this product has ended.',
  },
  unknown: {
    label: 'Unknown',
    shortLabel: 'UNKNOWN',
    tone: 'neutral',
    description: 'No warranty information has been recorded yet.',
  },
};

/** Resolve a status value (with fallback) into presentation metadata. */
export function getWarrantyMeta(status?: WarrantyStatus | null): WarrantyMeta {
  const key: WarrantyStatus =
    status === 'active' || status === 'expiring_soon' || status === 'expired'
      ? status
      : 'unknown';
  return { status: key, ...META[key] };
}

/** Fallback client-side status derivation when the API omits it. */
export function deriveWarrantyStatus(
  daysRemaining: number | null,
  expiringSoonDays: number = WARRANTY_EXPIRING_SOON_DAYS,
): WarrantyStatus {
  if (daysRemaining === null) return 'unknown';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= expiringSoonDays) return 'expiring_soon';
  return 'active';
}

/** Add whole months to an ISO date, clamped to the last valid day of month. */
export function addMonths(iso: string, months: number): string {
  const date = parseDate(iso);
  if (!date) return iso;
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) date.setDate(0);
  return toISODate(date);
}

/**
 * Compute a warranty end date from a start (or purchase) date + month count.
 * Returns `null` when there is not enough information.
 */
export function computeWarrantyEndDate(
  startDate?: string | null,
  purchaseDate?: string | null,
  months?: number | null,
): string | null {
  const base = startDate || purchaseDate;
  if (!base || months === null || months === undefined || months <= 0) return null;
  return addMonths(base, months);
}

/** Convenience: days remaining, preferring the value supplied by the API. */
export function resolveDaysRemaining(
  warrantyDaysRemaining: number | null | undefined,
  warrantyEndDate?: string | null,
): number | null {
  if (typeof warrantyDaysRemaining === 'number') return warrantyDaysRemaining;
  return daysUntil(warrantyEndDate);
}

export interface WarrantyHeadline {
  /** Big uppercase headline, e.g. "WARRANTY ACTIVE". */
  title: string;
  /** Secondary line, e.g. "340 DAYS REMAINING". */
  detail: string;
  tone: StatusTone;
}

/** Build the headline + detail lines for the large product warranty card. */
export function warrantyHeadline(
  status: WarrantyStatus | null | undefined,
  daysRemaining: number | null | undefined,
  endDate?: string | null,
): WarrantyHeadline {
  const meta = getWarrantyMeta(status);
  const days = resolveDaysRemaining(daysRemaining, endDate);

  if (meta.status === 'expired') {
    const ago = days === null ? null : Math.abs(days);
    return {
      title: 'WARRANTY EXPIRED',
      detail:
        ago !== null
          ? `Expired ${ago} ${ago === 1 ? 'DAY' : 'DAYS'} AGO · ${formatDate(endDate)}`
          : `Expired · ${formatDate(endDate)}`,
      tone: meta.tone,
    };
  }

  if (meta.status === 'expiring_soon') {
    return {
      title: 'WARRANTY EXPIRING SOON',
      detail:
        days !== null
          ? `${days} ${days === 1 ? 'DAY' : 'DAYS'} REMAINING · Expires ${formatDate(endDate)}`
          : `Expires ${formatDate(endDate)}`,
      tone: meta.tone,
    };
  }

  if (meta.status === 'active') {
    return {
      title: 'WARRANTY ACTIVE',
      detail:
        days !== null
          ? `${days} ${days === 1 ? 'DAY' : 'DAYS'} REMAINING · Expires ${formatDate(endDate)}`
          : `Expires ${formatDate(endDate)}`,
      tone: meta.tone,
    };
  }

  return {
    title: 'WARRANTY UNKNOWN',
    detail: 'Add warranty details to start tracking coverage.',
    tone: meta.tone,
  };
}

/** Tailwind classes for a status badge (background + border + text, light & dark). */
export function statusBadgeClasses(status?: WarrantyStatus | null): string {
  switch (getWarrantyMeta(status).tone) {
    case 'success':
      return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-600/15 dark:text-success-400 dark:border-success-600/30';
    case 'warning':
      return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:border-warning-500/30';
    case 'danger':
      return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-600/15 dark:text-danger-400 dark:border-danger-600/30';
    case 'brand':
      return 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30';
    default:
      return 'bg-elevated text-subtle border-line';
  }
}

/** A solid dot colour used alongside the label (never the only signal). */
export function statusDotClasses(status?: WarrantyStatus | null): string {
  switch (getWarrantyMeta(status).tone) {
    case 'success':
      return 'bg-success-600';
    case 'warning':
      return 'bg-warning-500';
    case 'danger':
      return 'bg-danger-600';
    case 'brand':
      return 'bg-brand-600';
    default:
      return 'bg-slate-400';
  }
}
