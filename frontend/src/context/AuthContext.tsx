import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  authApi,
  getErrorMessage,
  setAuthFailureHandler,
  tokenStore,
  type LoginInput,
  type RegisterInput,
} from '../lib/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** True while the initial session restore (/auth/me) is in flight. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocalUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateLocalUser = useCallback((next: User) => setUser(next), []);

  const refreshUser = useCallback(async () => {
    const data = await authApi.me();
    setUser(data);
  }, []);

  // Restore the session on first mount when a token is present.
  useEffect(() => {
    let active = true;
    const token = tokenStore.getAccess();

    if (!token) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    authApi
      .me()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) {
          tokenStore.clear();
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // When the API layer clears tokens on a failed refresh, drop the user so the
  // protected routes redirect to /login.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await authApi.login(input);
    tokenStore.set(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await authApi.register(input);
    tokenStore.set(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Logging out should never be blocked by a network hiccup.
      void getErrorMessage(error);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch (error) {
      void getErrorMessage(error);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      logoutAll,
      refreshUser,
      updateLocalUser,
    }),
    [user, loading, login, register, logout, logoutAll, refreshUser, updateLocalUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
