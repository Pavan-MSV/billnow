import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { notificationsApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 60_000;

/**
 * Tracks the unread notification count so the sidebar/topbar badges stay in
 * sync (and refresh when notifications are read elsewhere).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationsApi.unreadCount();
      setUnreadCount(count);
    } catch {
      /* silently ignore — the badge simply won't update */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    void refreshUnreadCount();
    const timer = window.setInterval(() => void refreshUnreadCount(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refreshUnreadCount]);

  const value = useMemo<NotificationContextValue>(
    () => ({ unreadCount, refreshUnreadCount, setUnreadCount }),
    [unreadCount, refreshUnreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
