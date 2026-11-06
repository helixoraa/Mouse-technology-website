import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Called by the login flow once the server has issued the session cookie. */
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    api<{ user: User }>('/auth/me')
      .then((r) => alive && setUser(r.user))
      .catch((e) => {
        if (alive && !(e instanceof ApiError && e.status === 401)) console.error(e);
        if (alive) setUser(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // A revoked session (password reset, deactivation) surfaces as 401 on any admin call: drop to the login screen.
  useEffect(() => {
    // A 401 can also mean "wrong current password" on a security endpoint, so confirm the session is really gone first.
    const onUnauthorized = () => {
      api('/auth/me').catch((e) => {
        if (e instanceof ApiError && e.status === 401) setUser(null);
      });
    };
    window.addEventListener('maouaj:unauthorized', onUnauthorized);
    return () => window.removeEventListener('maouaj:unauthorized', onUnauthorized);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      qc.clear();
    }
  }, [qc]);

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Redirects to /admin/login when signed out and to the dashboard when the role is not allowed. */
export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: User['role'][] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950" role="status" aria-label="Loading">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-sky border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
