import axios from 'axios';

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
      // Deliberately NOT calling queryClient.clear() here.
      //
      // clear() removes every query from the cache, and removal calls
      // Query.destroy() -> cancel({ silent: true }). A silent cancel is
      // specified to dispatch no state update at all, so the query it kills is
      // frozen at { status: 'pending', fetchStatus: 'fetching' } — which is
      // exactly `isLoading: true`. The entry is also gone from the cache, so
      // nothing ever rebuilds it and no later fetch can resolve it.
      //
      // The request that triggers this interceptor is usually `/auth/me` on the
      // login page, where a 401 just means "not signed in yet". Clearing there
      // destroyed AuthProvider's own in-flight session query, stranding
      // `isLoading` at true for the rest of the page's life. Every route guard
      // renders <PageSkeleton /> while `isLoading`, so after signing in the
      // dashboard sat on its shimmer forever and never mounted the page that
      // would have fetched its data — for all four roles.
      //
      // Nothing is leaked by dropping the call: the redirect below is a full
      // document load, which discards the whole in-memory cache anyway, and
      // logout() clears explicitly before reloading. On /login and /auth there
      // is no signed-in data cached to protect.
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
