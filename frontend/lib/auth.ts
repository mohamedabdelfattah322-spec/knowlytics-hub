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

export const saveToken = (token: string) => {
  Cookies.set('kh_token', token, { expires: 7, sameSite: 'strict' });
};

export const getToken = () => Cookies.get('kh_token');

export const clearToken = () => Cookies.remove('kh_token');

export const logout = async () => {
  try { await api.post('/auth/logout'); } catch {}
  clearToken();
  if (typeof window !== 'undefined') window.location.href = '/login';
};
