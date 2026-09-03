import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 0,
    },
  },
});
