import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { TOKEN_KEY } from '../api/axios.js';

// Context API = a way to share state (the logged-in user) with any component
// without passing props down through every level ("prop drilling").
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token on page load

  // On first load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY)) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = useCallback(async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data), []);
  const register = useCallback(async (name, email, password) => saveSession((await api.post('/auth/register', { name, email, password })).data), []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
