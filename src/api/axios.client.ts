import axios, { AxiosResponse } from 'axios';
import { queryClient } from './query.client';

const TOKEN_STORAGE_KEY = 'auth_token';

/** Set by the API whenever it slides the session forward. Lower-cased: axios normalises response header names. */
const REFRESHED_TOKEN_HEADER = 'x-auth-token';

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
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Keeps the stored token in step with the sliding session.
 *
 * The server re-issues the token once it is over half spent. The httpOnly
 * cookie updates itself, but this copy — the fallback used when the browser
 * blocks the cross-site cookie — is invisible to `Set-Cookie`, so without this
 * it would age out from under a session the server still considers live.
 */
function persistRenewedToken(response?: AxiosResponse): void {
  if (typeof window === 'undefined' || !response) return;

  const renewed = (response.headers as Record<string, unknown> | undefined)?.[
    REFRESHED_TOKEN_HEADER
  ];
  if (typeof renewed !== 'string' || !renewed) return;

  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, renewed);
  } catch {
    // Ignore storage errors
  }
}

apiClient.interceptors.response.use(
  (response) => {
    persistRenewedToken(response);
    return response;
  },
  (error) => {
    // A renewal can ride along on an error response too (a 403 from a route the
    // account may not touch is still an authenticated request).
    persistRenewedToken(error.response);

    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/me') && !url.includes('/auth/otp')) {
      // Deliberately no sign-out here. A lone 401 is not proof the session
      // ended: it can come from a request that raced a token renewal, an API
      // restarting, or one endpoint this account cannot reach — and wiping
      // storage and jumping to /login on any of those is exactly the surprise
      // logout users hit. Re-ask the one endpoint that actually knows instead.
      // If /auth/me rejects too, AuthContext clears the session and the route
      // guards navigate; if it succeeds, the user carries on undisturbed.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }

    return Promise.reject(error);
  },
);
