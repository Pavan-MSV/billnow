/**
 * BillNow API client.
 *
 * Single axios instance with:
 *  - baseURL from VITE_API_URL (defaults to http://localhost:8000)
 *  - request interceptor attaching the Bearer access token
 *  - response interceptor that transparently refreshes the access token once
 *    on a 401, then retries the original request. If the refresh fails the
 *    stored tokens are cleared and an auth-failure handler is invoked (the
 *    AuthContext listens and redirects to /login).
 *
 * Typed helper functions for every endpoint live in the grouped objects below.
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import type {
  ApiErrorBody,
  AuthResponse,
  ChangePasswordInput,
  DashboardSummary,
  Insights,
  Invoice,
  MessageResponse,
  Notification,
  NotificationPreferences,
  Paginated,
  PreferencesUpdateInput,
  Product,
  ProductInput,
  ProductQuery,
  ProfileUpdateInput,
  RefreshResponse,
  ServiceRecord,
  ServiceRecordInput,
  UpdatedCountResponse,
  UpcomingWarranty,
  UnreadCountResponse,
  User,
  WarrantyCounts,
  WarrantyListItem,
  WarrantyListResponse,
  WarrantyStatus,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ACCESS_TOKEN_KEY = 'billnow_access_token';
const REFRESH_TOKEN_KEY = 'billnow_refresh_token';

/** localStorage-backed token persistence. */
export const tokenStore = {
  getAccess(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      /* storage unavailable — ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* -------------------------------------------------------------------------- */
/* Auth failure handling                                                       */
/* -------------------------------------------------------------------------- */

type AuthFailureHandler = () => void;
let authFailureHandler: AuthFailureHandler | null = null;

/** Register a callback invoked when tokens are cleared due to an auth failure. */
export function setAuthFailureHandler(handler: AuthFailureHandler | null): void {
  authFailureHandler = handler;
}

/* -------------------------------------------------------------------------- */
/* Axios instance                                                              */
/* -------------------------------------------------------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Single in-flight refresh shared across concurrent 401s.
let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh')
  );
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');
  const { data } = await axios.post<RefreshResponse>(`${API_BASE_URL}/api/auth/refresh`, {
    refresh_token: refreshToken,
  });
  tokenStore.set(data.access_token, data.refresh_token);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      if (!tokenStore.getRefresh()) {
        tokenStore.clear();
        authFailureHandler?.();
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      } catch (refreshError) {
        tokenStore.clear();
        authFailureHandler?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/* Error helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Extract a friendly, human-readable message from any thrown error. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorBody>;
    if (!err.response) {
      return 'Unable to reach the server. Please check your internet connection and try again.';
    }
    const body = err.response.data;
    if (body) {
      if (typeof body.message === 'string' && body.message.trim()) return body.message;
      if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
      if (Array.isArray(body.detail) && body.detail.length > 0) {
        const first = body.detail[0];
        if (first && typeof first.msg === 'string') return first.msg;
      }
    }
    if (err.response.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (err.response.status >= 500) {
      return 'The server ran into a problem. Please try again in a moment.';
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  otp?: string;
  password: string;
  account_type?: 'personal' | 'business';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SendOtpInput {
  email: string;
  phone: string;
  channel?: 'email' | 'sms';
}

export interface SendOtpResponse {
  message: string;
  channel?: 'email' | 'sms';
  dev_otp?: string;
  expires_in: number;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export const authApi = {
  sendOtp: (payload: SendOtpInput) =>
    api.post<SendOtpResponse>('/api/auth/send-otp', payload).then((r) => r.data),
  verifyOtp: (payload: VerifyOtpInput) =>
    api.post<MessageResponse>('/api/auth/verify-otp', payload).then((r) => r.data),
  register: (payload: RegisterInput) =>
    api.post<AuthResponse>('/api/auth/register', payload).then((r) => r.data),
  login: (payload: LoginInput) =>
    api.post<AuthResponse>('/api/auth/login', payload).then((r) => r.data),
  refresh: (refreshToken: string) =>
    api
      .post<RefreshResponse>('/api/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/api/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, newPassword: string) =>
    api
      .post<MessageResponse>('/api/auth/reset-password', { token, new_password: newPassword })
      .then((r) => r.data),
  requestAccountDeletion: (email: string) =>
    api.post<MessageResponse>('/api/auth/request-account-deletion', { email }).then((r) => r.data),
  confirmAccountDeletion: (token: string) =>
    api.post<MessageResponse>('/api/auth/confirm-account-deletion', { token }).then((r) => r.data),
  logout: () => api.post<MessageResponse>('/api/auth/logout').then((r) => r.data),
  logoutAll: () => api.post<MessageResponse>('/api/auth/logout-all').then((r) => r.data),
  me: () => api.get<User>('/api/auth/me').then((r) => r.data),
};

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

export const productsApi = {
  list: (query: ProductQuery = {}) =>
    api
      .get<Paginated<Product>>('/api/products', { params: cleanParams(query) })
      .then((r) => r.data),
  create: (payload: ProductInput) => api.post<Product>('/api/products', payload).then((r) => r.data),
  get: (id: number | string) => api.get<Product>(`/api/products/${id}`).then((r) => r.data),
  update: (id: number | string, payload: Partial<ProductInput>) =>
    api.put<Product>(`/api/products/${id}`, payload).then((r) => r.data),
  remove: (id: number | string) => api.delete<void>(`/api/products/${id}`).then(() => undefined),
  categories: () => api.get<string[]>('/api/products/categories').then((r) => r.data),
};

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

export const invoiceApi = {
  upload: (productId: number | string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Invoice>(`/api/products/${productId}/invoice`, form, {
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      })
      .then((r) => r.data);
  },
  get: (productId: number | string) =>
    api.get<Invoice>(`/api/products/${productId}/invoice`).then((r) => r.data),
  remove: (productId: number | string) =>
    api.delete<void>(`/api/products/${productId}/invoice`).then(() => undefined),
};

/** Fetch an invoice as a blob (used for authenticated view/download). */
async function fetchInvoiceBlob(
  productId: number | string,
  mode: 'view' | 'download',
): Promise<Blob> {
  const response = await api.get<Blob>(`/api/products/${productId}/invoice/${mode}`, {
    responseType: 'blob',
  });
  return response.data;
}

/** Open an authenticated invoice file in a new browser tab. */
export async function openInvoiceInNewTab(productId: number | string): Promise<void> {
  const blob = await fetchInvoiceBlob(productId, 'view');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Trigger an authenticated file download. */
export async function downloadInvoice(productId: number | string, fileName?: string): Promise<void> {
  const blob = await fetchInvoiceBlob(productId, 'download');
  triggerBlobDownload(blob, fileName || `invoice-${productId}`);
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

/* -------------------------------------------------------------------------- */
/* Warranties                                                                  */
/* -------------------------------------------------------------------------- */

export const warrantiesApi = {
  list: (status?: WarrantyStatus | '') =>
    api
      .get<WarrantyListResponse>('/api/warranties', {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data),
  expiring: () => api.get<WarrantyListItem[]>('/api/warranties/expiring').then((r) => r.data),
  expired: () => api.get<WarrantyListItem[]>('/api/warranties/expired').then((r) => r.data),
  counts: () =>
    api.get<WarrantyListResponse>('/api/warranties').then((r) => r.data.counts) as Promise<WarrantyCounts>,
};

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const servicesApi = {
  list: (productId: number | string) =>
    api.get<ServiceRecord[]>(`/api/products/${productId}/services`).then((r) => r.data),
  create: (productId: number | string, payload: ServiceRecordInput) =>
    api.post<ServiceRecord>(`/api/products/${productId}/services`, payload).then((r) => r.data),
  update: (serviceId: number | string, payload: Partial<ServiceRecordInput>) =>
    api.put<ServiceRecord>(`/api/services/${serviceId}`, payload).then((r) => r.data),
  remove: (serviceId: number | string) =>
    api.delete<void>(`/api/services/${serviceId}`).then(() => undefined),
};

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api
      .get<Notification[]>('/api/notifications', { params: { unread_only: unreadOnly } })
      .then((r) => r.data),
  unreadCount: () =>
    api.get<UnreadCountResponse>('/api/notifications/unread-count').then((r) => r.data),
  markRead: (id: number | string) =>
    api.patch<Notification>(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    api.patch<UpdatedCountResponse>('/api/notifications/read-all').then((r) => r.data),
  getPreferences: () =>
    api.get<NotificationPreferences>('/api/notifications/preferences').then((r) => r.data),
  updatePreferences: (payload: Partial<NotificationPreferences>) =>
    api.put<NotificationPreferences>('/api/notifications/preferences', payload).then((r) => r.data),
  registerFcmToken: (token: string, platform = 'android') =>
    api.post<MessageResponse>('/api/notifications/fcm-token', { token, platform }).then((r) => r.data),
  unregisterFcmToken: (token: string) =>
    api.delete<MessageResponse>('/api/notifications/fcm-token', { params: { token } }).then((r) => r.data),
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/api/dashboard/summary').then((r) => r.data),
  upcoming: (days = 90) =>
    api.get<UpcomingWarranty[]>('/api/dashboard/upcoming', { params: { days } }).then((r) => r.data),
};

/* -------------------------------------------------------------------------- */
/* Insights                                                                    */
/* -------------------------------------------------------------------------- */

export const insightsApi = {
  get: () => api.get<Insights>('/api/insights').then((r) => r.data),
};

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export const settingsApi = {
  getProfile: () => api.get<User>('/api/settings/profile').then((r) => r.data),
  updateProfile: (payload: ProfileUpdateInput) =>
    api.put<User>('/api/settings/profile', payload).then((r) => r.data),
  updatePreferences: (payload: PreferencesUpdateInput) =>
    api.put<User>('/api/settings/preferences', payload).then((r) => r.data),
  changePassword: (payload: ChangePasswordInput) =>
    api.post<MessageResponse>('/api/settings/change-password', payload).then((r) => r.data),
  exportData: async (format: 'json' | 'csv' = 'json') => {
    const response = await api.get<Blob>('/api/settings/export', {
      params: { format },
      responseType: 'blob',
    });
    const filename =
      format === 'csv'
        ? `billnow-products-${Date.now()}.csv`
        : `billnow-export-${Date.now()}.json`;
    triggerBlobDownload(response.data, filename);
  },
  deleteAccount: (password?: string) =>
    api
      .request<void>({
        method: 'DELETE',
        url: '/api/settings/account',
        data: password ? { password } : undefined,
      })
      .then(() => undefined),
};

/* -------------------------------------------------------------------------- */
/* Misc helpers                                                                */
/* -------------------------------------------------------------------------- */

/** Remove empty/undefined params so they aren't serialized as empty strings. */
function cleanParams<T extends object>(query: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') result[key] = value;
  }
  return result;
}
