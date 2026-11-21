/**
 * Shared TypeScript types — these mirror the backend API contract exactly.
 */

export type AccountType = 'personal' | 'business';
export type ThemePreference = 'light' | 'dark' | 'system';
export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'unknown';
export type InvoiceFileType = string;

export interface User {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  account_type: string;
  currency: string;
  theme: ThemePreference | string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface UpdatedCountResponse {
  updated: number;
}

export interface Invoice {
  id: string;
  product_id: string;
  file_name: string;
  file_type: InvoiceFileType | null;
  file_size: number | null;
  storage_path: string | null;
  uploaded_at: string;
}

export interface ServiceRecord {
  id: string;
  product_id: string;
  service_date: string | null;
  service_type: string | null;
  provider: string | null;
  cost: number | null;
  description: string | null;
  next_service_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceRecordInput {
  service_date?: string | null;
  service_type?: string | null;
  provider?: string | null;
  cost?: number | null;
  description?: string | null;
  next_service_date?: string | null;
  notes?: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string | null;
  seller: string | null;
  invoice_number: string | null;
  warranty_start_date: string | null;
  warranty_period_months: number | null;
  warranty_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  warranty_status: WarrantyStatus;
  warranty_days_remaining: number | null;
  invoice: Invoice | null;
  services: ServiceRecord[];
}

export interface ProductInput {
  name: string;
  category?: string | null;
  brand?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  currency?: string | null;
  seller?: string | null;
  invoice_number?: string | null;
  warranty_start_date?: string | null;
  warranty_period_months?: number | null;
  warranty_end_date?: string | null;
  notes?: string | null;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  warranty_status?: WarrantyStatus | '';
  sort?: 'purchase_date' | 'warranty_end' | 'price' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface WarrantyListItem {
  product_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  warranty_end_date: string | null;
  warranty_status: WarrantyStatus;
  warranty_days_remaining: number | null;
  purchase_price: number | null;
  currency: string | null;
}

export interface WarrantyCounts {
  active: number;
  expiring_soon: number;
  expired: number;
}

export interface WarrantyListResponse {
  items: WarrantyListItem[];
  counts: WarrantyCounts;
}

export type NotificationType = string;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  product_id: string | null;
  product_name: string | null;
  due_date: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  reminder_90_days: boolean;
  reminder_60_days: boolean;
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  browser_enabled: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface DashboardSummary {
  total_products: number;
  active_warranties: number;
  expiring_soon: number;
  expired: number;
  total_purchase_value: number;
  currency: string;
}

export interface UpcomingWarranty {
  product_id: string;
  name: string;
  category: string | null;
  warranty_end_date: string | null;
  days_remaining: number | null;
  warranty_status: WarrantyStatus;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface Insights {
  total_purchase_value: number;
  currency: string;
  products_by_category: CategoryCount[];
  spending_by_category: CategoryAmount[];
  warranty_split: {
    active: number;
    expiring_soon: number;
    expired: number;
  };
  upcoming_expirations: UpcomingWarranty[];
}

export interface ProfileUpdateInput {
  name?: string;
  email?: string;
  profile_image?: string | null;
}

export interface PreferencesUpdateInput {
  currency?: string;
  theme?: ThemePreference;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export interface ApiErrorBody {
  detail?: string | { msg?: string }[];
  message?: string;
}
