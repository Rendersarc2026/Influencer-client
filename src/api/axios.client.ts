import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if stored token exists (fallback for third-party cookie restrictions)

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (
      error.response &&
      error.response.status === 401 &&
      !url.includes('/auth/me') &&
      !url.includes('/auth/otp')
    ) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/auth')
      ) {
        try {
          localStorage.removeItem('app_role_code');
          localStorage.removeItem('app_session_active');
          localStorage.removeItem('auth_token');
        } catch {
          // Ignore storage errors
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
