// src/context/AuthContext.tsx — global auth state
//
// Wraps the app, restores the session on load (via /api/auth/me), and exposes
// login / register / logout plus the current user and loading flags.

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  AuthUser,
  getToken,
  setToken,
  clearToken,
  fetchMe,
  loginRequest,
  registerRequest,
} from '../lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;          // true while we restore the session on first load
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    securityQuestions: { questionId: string; answer: string }[]
  ) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if a token exists.
  const restore = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await fetchMe();
      setUser(user);
    } catch {
      // Token invalid/expired/disabled — clear it.
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  const login = useCallback(async (identifier: string, password: string) => {
    const { token, user } = await loginRequest({ identifier, password });
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    securityQuestions: { questionId: string; answer: string }[]
  ) => {
    const { token, user } = await registerRequest({ username, email, password, securityQuestions });
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await fetchMe();
      setUser(user);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
