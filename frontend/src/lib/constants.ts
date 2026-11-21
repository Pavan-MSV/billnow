/** App-wide constants that mirror backend configuration. */

export const PRODUCT_CATEGORIES = [
  'Television',
  'Mobile Phone',
  'Laptop',
  'Tablet',
  'Refrigerator',
  'Washing Machine',
  'Air Conditioner',
  'Microwave',
  'Printer',
  'Camera',
  'Audio',
  'Gaming',
  'Home Appliance',
  'Kitchen Appliance',
  'Computer',
  'Networking',
  'Vehicle',
  'Furniture',
  'Other',
] as const;

export const OTHER_CATEGORY = 'Other';

/** Matches backend MAX_UPLOAD_SIZE_MB. */
export const MAX_INVOICE_SIZE_MB = 10;
export const MAX_INVOICE_SIZE_BYTES = MAX_INVOICE_SIZE_MB * 1024 * 1024;

/** Matches backend ALLOWED_UPLOAD_TYPES. */
export const ALLOWED_INVOICE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const ALLOWED_INVOICE_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export const DEFAULT_CURRENCY = 'INR';

export const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
] as const;

/** Matches backend WARRANTY_EXPIRING_SOON_DAYS. */
export const WARRANTY_EXPIRING_SOON_DAYS = 30;

export const PRODUCT_PAGE_SIZE = 12;

export const APP_NAME = 'BillNow';
export const APP_TAGLINE = 'Never Forget a Warranty Again.';
export const APP_SUPPORTING =
  'Your products, invoices and warranties — all in one place.';
