import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('refurbicon_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('refurbicon_token');
      localStorage.removeItem('refurbicon_user');
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/m') && !path.startsWith('/shop')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—');
export const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

export function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (['PUBLISHED', 'ACTIVE', 'PAID', 'PRESENT', 'DELIVERED', 'APPROVED', 'PROCESSED'].includes(s)) return 'badge-green';
  if (['OUT_OF_STOCK', 'CANCELLED', 'ABSENT', 'FAILED', 'REJECTED', 'INACTIVE', 'EXPIRED'].includes(s)) return 'badge-red';
  if (['PENDING', 'LATE', 'DRAFT', 'ON_LEAVE', 'PARTIAL', 'PROCESSING', 'PLACED'].includes(s)) return 'badge-orange';
  return 'badge-blue';
}
