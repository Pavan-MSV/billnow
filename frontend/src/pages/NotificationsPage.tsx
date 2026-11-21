import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  ShieldX,
  TriangleAlert,
  Wrench,
} from 'lucide-react';

import { getErrorMessage, notificationsApi } from '../lib/api';
import { cn } from '../lib/cn';
import { formatDate, formatRelative } from '../lib/format';
import { useNotifications } from '../context/NotificationContext';
import type { Notification } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';

type AlertFilter = 'all' | 'expiring_soon' | 'expired' | 'service';

export function NotificationsPage() {
  const { showToast } = useToast();
  const { setUnreadCount, refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AlertFilter>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await notificationsApi.list(false);
      setNotifications(list);
      setUnreadCount(list.filter((item) => !item.is_read).length);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load alerts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notification: Notification) => {
    if (notification.is_read) return;
    try {
      const updated = await notificationsApi.markRead(notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? updated : item))
      );
      await refreshUnreadCount();
    } catch (err) {
      // silently ignore or log
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      showToast({ variant: 'success', title: 'All alerts marked as read' });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not mark all as read',
        message: getErrorMessage(err, 'Please try again.'),
      });
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  // Filter notifications by section/category
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'expiring_soon') {
      return notifications.filter(
        (n) =>
          n.type.toLowerCase().includes('expir') ||
          n.title.toLowerCase().includes('expir') ||
          n.title.toLowerCase().includes('soon') ||
          n.message.toLowerCase().includes('expires in')
      );
    }
    if (activeTab === 'expired') {
      return notifications.filter(
        (n) =>
          n.type.toLowerCase().includes('expired') ||
          n.title.toLowerCase().includes('expired') ||
          n.message.toLowerCase().includes('expired')
      );
    }
    if (activeTab === 'service') {
      return notifications.filter(
        (n) =>
          n.type.toLowerCase().includes('service') ||
          n.title.toLowerCase().includes('service') ||
          n.message.toLowerCase().includes('service')
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const getAlertIcon = (n: Notification) => {
    const text = (n.type + ' ' + n.title + ' ' + n.message).toLowerCase();
    if (text.includes('service')) {
      return {
        icon: Wrench,
        badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300',
        iconBg: 'bg-teal-500 text-white',
        typeLabel: 'Service Reminder',
      };
    }
    if (text.includes('expired')) {
      return {
        icon: ShieldX,
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300',
        iconBg: 'bg-rose-500 text-white',
        typeLabel: 'Warranty Expired',
      };
    }
    return {
      icon: TriangleAlert,
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300',
      iconBg: 'bg-amber-500 text-white',
      typeLabel: 'Warranty Expiring Soon',
    };
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 17. Mobile Header: Alerts */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-[11px] font-medium text-subtle">
            Warranty and service reminders
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-subtle hover:text-ink active:scale-95 transition-all"
          >
            <CheckCheck className="h-3.5 w-3.5 text-brand-600" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs matching Requirement 17 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {(
          [
            { id: 'all', label: 'All Alerts' },
            { id: 'expiring_soon', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' },
            { id: 'service', label: 'Service Reminders' },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shrink-0',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-line/80 bg-surface text-subtle hover:border-brand-300 hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadNotifications} />
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface/50 p-8 text-center">
          <Bell className="mx-auto h-10 w-10 text-subtle" />
          <h3 className="mt-3 text-sm font-bold text-ink">No alerts right now</h3>
          <p className="mt-1 text-xs text-subtle max-w-[240px] mx-auto leading-relaxed">
            {activeTab === 'all'
              ? "You're all caught up! When a warranty approaches expiry or service is due, you'll see alerts here."
              : `No alerts under "${activeTab.replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const meta = getAlertIcon(n);
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  'group rounded-2xl border p-4 shadow-sm transition-all select-none',
                  n.is_read
                    ? 'border-line/70 bg-surface'
                    : 'border-brand-200 bg-brand-50/50 dark:border-brand-500/25 dark:bg-brand-500/10'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                      meta.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Notification Type & Date */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          meta.badge
                        )}
                      >
                        {meta.typeLabel}
                      </span>
                      <span className="text-[10px] font-medium text-subtle">
                        {formatRelative(n.created_at)}
                      </span>
                    </div>

                    {/* Product Name & Message */}
                    <h3 className="mt-1.5 text-xs font-bold text-ink truncate">
                      {n.product_name ? n.product_name : n.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-subtle leading-relaxed">
                      {n.message}
                    </p>

                    {/* Footer Actions: View Product */}
                    <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2.5">
                      {n.due_date ? (
                        <span className="text-[11px] font-medium text-subtle">
                          Due: {formatDate(n.due_date)}
                        </span>
                      ) : (
                        <span />
                      )}

                      {n.product_id ? (
                        <Link
                          to={`/products/${n.product_id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 active:scale-95"
                        >
                          <span>View Product</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
