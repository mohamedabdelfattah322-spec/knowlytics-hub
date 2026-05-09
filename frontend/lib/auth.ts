import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  student_type?: 'live' | 'online';
  avatar_url?: string;
}

export const saveToken = (token: string, days?: number) => {
  // If days not set → session cookie (expires when browser closes)
  const opts: Cookies.CookieAttributes = { sameSite: 'strict' };
  if (days) opts.expires = days;
  Cookies.set('kh_token', token, opts);
};

export const getToken = () => Cookies.get('kh_token');

export const clearToken = () => Cookies.remove('kh_token');

export const logout = async () => {
  try { await api.post('/auth/logout'); } catch {}
  clearToken();
  if (typeof window !== 'undefined') window.location.href = '/login';
};
