import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(payload) {
        const data = await api.post('/auth/login', payload);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const data = await api.post('/auth/register', payload);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        await api.post('/auth/logout', {});
        setUser(null);
      },
      async refreshUser() {
        const data = await api.get('/user/me');
        setUser(data.user);
        return data.user;
      }
    }),
    [user, loading]
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
