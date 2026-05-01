import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT + Device ID on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('kh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Stable device ID stored in localStorage
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('kh_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('kh_device_id', deviceId);
    }
    config.headers['X-Device-ID'] = deviceId;
  }

  return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('kh_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
