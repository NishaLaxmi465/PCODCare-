import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiErrorMessage, tokenKeys } from '../api/client.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(tokenKeys.user));
  } catch (_error) {
    return null;
  }
}

function persistAuth(data) {
  localStorage.setItem(tokenKeys.access, data.accessToken);
  localStorage.setItem(tokenKeys.refresh, data.refreshToken);
  localStorage.setItem(tokenKeys.user, JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem(tokenKeys.access);
  localStorage.removeItem(tokenKeys.refresh);
  localStorage.removeItem(tokenKeys.user);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const refreshed = (event) => setUser(event.detail.user);
    const expired = () => {
      clearAuth();
      setUser(null);
    };

    window.addEventListener('pcodcare-auth-refreshed', refreshed);
    window.addEventListener('pcodcare-auth-expired', expired);
    return () => {
      window.removeEventListener('pcodcare-auth-refreshed', refreshed);
      window.removeEventListener('pcodcare-auth-expired', expired);
    };
  }, []);

  const authenticate = async (mode, payload) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/auth/${mode}`, payload);
      persistAuth(data);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = apiErrorMessage(err, 'Authentication failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(tokenKeys.refresh);
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (_error) {
      // Local logout should still proceed when the token is already expired.
    }
    clearAuth();
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/users/me');
    localStorage.setItem(tokenKeys.user, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      error,
      loading,
      isAuthenticated: Boolean(user && localStorage.getItem(tokenKeys.access)),
      login: (payload) => authenticate('login', payload),
      register: (payload) => authenticate('register', payload),
      logout,
      setUser: (nextUser) => {
        localStorage.setItem(tokenKeys.user, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      refreshProfile,
    }),
    [user, error, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
