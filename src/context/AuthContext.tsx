import React, { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@api';
import {
  CurrentUserResponse,
  RoleCode,
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpResponse,
  UpdateProfileRequest,
} from '@contracts';
import { AuthContext } from './auth-context-def';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: authData,
    isLoading,
    refetch,
  } = useQuery<CurrentUserResponse | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<CurrentUserResponse>('/auth/me');
        if (response.data?.roleCode) {
          try {
            localStorage.setItem('app_role_code', response.data.roleCode);
            localStorage.setItem('app_session_active', 'true');
          } catch {
            // Ignore storage errors
          }
        }
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        // The only path that ends a session without the user asking, and it takes
        // the authoritative endpoint rejecting the token to get here: the account
        // was blocked, or someone logged out elsewhere. Sessions themselves slide
        // forward as the app is used, so ordinary use never reaches this.
        if (axiosErr?.response?.status === 401) {
          try {
            localStorage.removeItem('app_role_code');
            localStorage.removeItem('app_session_active');
            localStorage.removeItem('auth_token');
          } catch {
            // Ignore storage errors
          }
          return null;
        }
        // If it's a network drop / laptop sleep wakeup / offline error, throw so React Query preserves cached session and retries
        throw err;
      }
    },
    retry: (failureCount, error: unknown) => {
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    // The server renews the session on use rather than expiring it on a clock,
    // so there is nothing to re-check on a schedule; a reconnect refetch is
    // enough. Re-validating more often only risks turning a blip into a logout.
    staleTime: 1000 * 60 * 60 * 24,
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (data: RequestOtpRequest) => {
      const response = await apiClient.post<RequestOtpResponse>('/auth/otp/request', data);
      return response.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      try {
        localStorage.removeItem('app_role_code');
        localStorage.removeItem('app_session_active');
        localStorage.removeItem('auth_token');
      } catch (_err) {
        // Ignore localStorage errors in private browsing/restricted environments
      }
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const requestOtp = React.useCallback(
    async (email: string): Promise<RequestOtpResponse> => {
      return requestOtpMutation.mutateAsync({ email });
    },
    [requestOtpMutation],
  );

  const verifyOtp = React.useCallback(
    async (email: string, code: string): Promise<CurrentUserResponse> => {
      const verifyRes = await apiClient.post<VerifyOtpResponse>('/auth/otp/verify', {
        email,
        code,
      });
      if (verifyRes.data?.token) {
        try {
          localStorage.setItem('auth_token', verifyRes.data.token);
        } catch {
          // Ignore storage errors
        }
      }
      const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
      if (meRes.data?.roleCode) {
        try {
          localStorage.setItem('app_role_code', meRes.data.roleCode);
          localStorage.setItem('app_session_active', 'true');
        } catch (_err) {
          // Ignore localStorage errors
        }
      }
      queryClient.setQueryData(['auth', 'me'], meRes.data);
      return meRes.data;
    },
    [queryClient],
  );

  const logout = React.useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const acceptTerms = React.useCallback(async (): Promise<CurrentUserResponse> => {
    await apiClient.post('/terms/accept');
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  }, [queryClient]);

  const completeProfile = React.useCallback(
    async (data: UpdateProfileRequest): Promise<CurrentUserResponse> => {
      await apiClient.put('/users/profile', data);
      const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
      queryClient.setQueryData(['auth', 'me'], meRes.data);
      return meRes.data;
    },
    [queryClient],
  );

  const refetchUser = React.useCallback(async (): Promise<CurrentUserResponse | null> => {
    const res = await refetch();
    return res.data ?? null;
  }, [refetch]);

  const user = authData?.user ?? null;
  const cachedRole =
    typeof window !== 'undefined'
      ? (localStorage.getItem('app_role_code') as RoleCode | null)
      : null;
  const roleCode = (authData?.roleCode as RoleCode) ?? cachedRole ?? null;

  React.useEffect(() => {
    if (authData?.roleCode) {
      try {
        localStorage.setItem('app_role_code', authData.roleCode);
        localStorage.setItem('app_session_active', 'true');
      } catch (_err) {
        // Ignore localStorage errors
      }
    }
  }, [authData?.roleCode]);

  const profileComplete = authData?.profileComplete ?? false;
  const termsAccepted = authData?.termsAccepted ?? false;
  const isAuthenticated = Boolean(user && roleCode);

  const contextValue = React.useMemo(
    () => ({
      user,
      roleCode,
      profileComplete,
      termsAccepted,
      isLoading,
      isAuthenticated,
      requestOtp,
      verifyOtp,
      logout,
      acceptTerms,
      completeProfile,
      refetchUser,
    }),
    [
      user,
      roleCode,
      profileComplete,
      termsAccepted,
      isLoading,
      isAuthenticated,
      requestOtp,
      verifyOtp,
      logout,
      acceptTerms,
      completeProfile,
      refetchUser,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
