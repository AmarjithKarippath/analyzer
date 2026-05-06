import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'pnl_auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token: t, user: u } = JSON.parse(raw);
        if (t) {
          setToken(t);
          setUser(u);
          axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        }
      }
    } catch (_) {}
    setBootstrapping(false);
  }, []);

  // Auto-logout on 401
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401 && token) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const persist = (t, u) => {
    setToken(t);
    setUser(u);
    if (t) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await axios.post('/auth/register', { email, password, name });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const credLen = credential?.length || 0;
    const url = `${axios.defaults.baseURL || ''}/auth/google`;
    // eslint-disable-next-line no-console
    console.log('[auth] loginWithGoogle → POST', url, '| credential length:', credLen);
    if (!credential) {
      // eslint-disable-next-line no-console
      console.error('[auth] loginWithGoogle called with EMPTY credential — GoogleLogin onSuccess fired without one.');
      throw new Error('Empty Google credential');
    }
    try {
      const res = await axios.post('/auth/google', { credential });
      // eslint-disable-next-line no-console
      console.log('[auth] /auth/google OK:', { user: res.data?.user, tokenLen: res.data?.token?.length });
      persist(res.data.token, res.data.user);
      return res.data.user;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] /auth/google FAILED:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
        code: err?.code,
      });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    bootstrapping,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
