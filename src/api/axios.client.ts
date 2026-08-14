import axios from 'axios';
import { queryClient } from './query.client';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear query cache on unauthenticated response
      queryClient.clear();

      // Only redirect if not already on the login/auth page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/auth')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
