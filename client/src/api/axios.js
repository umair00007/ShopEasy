import axios from 'axios';

// One shared Axios instance for the whole app.
// baseURL "/api" works in dev (Vite proxy) and prod (Nginx proxy).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

export const TOKEN_KEY = 'shopeasy_token';

// Request interceptor: attach "Authorization: Bearer <token>" to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any error into a readable message for the UI.
export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default api;
