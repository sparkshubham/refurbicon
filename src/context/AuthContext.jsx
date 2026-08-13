import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('refurbicon_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('refurbicon_token'));

  useEffect(() => {
    const token = localStorage.getItem('refurbicon_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => {
        setUser(r.data.data);
        localStorage.setItem('refurbicon_user', JSON.stringify(r.data.data));
      })
      .catch(() => {
        localStorage.removeItem('refurbicon_token');
        localStorage.removeItem('refurbicon_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('refurbicon_token', data.data.token);
    localStorage.setItem('refurbicon_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  function logout() {
    localStorage.removeItem('refurbicon_token');
    localStorage.removeItem('refurbicon_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
