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
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        // Only return null if server explicitly responded with 401 (unauthorized / session expired)
        if (axiosErr?.response?.status === 401) {
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
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — session cookie is 7 days
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
      } catch (_err) {
        // Ignore localStorage errors in private browsing/restricted environments
      }
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const requestOtp = async (email: string): Promise<RequestOtpResponse> => {
    return requestOtpMutation.mutateAsync({ email });
  };

  const verifyOtp = async (email: string, code: string): Promise<CurrentUserResponse> => {
    await apiClient.post<VerifyOtpResponse>('/auth/otp/verify', { email, code });
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    if (meRes.data?.roleCode) {
      try {
        localStorage.setItem('app_role_code', meRes.data.roleCode);
      } catch (_err) {
        // Ignore localStorage errors
      }
    }
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  /**
   * The write has to be allowed to throw. Both of these gate a redirect: the
   * caller navigates on the refreshed session, and if the write silently failed
   * that session still says "not accepted" / "not complete", so the route guard
   * bounces the user straight back to the screen they just submitted — with no
   * error shown, because the failure was swallowed here.
   */
  const acceptTerms = async (): Promise<CurrentUserResponse> => {
    await apiClient.post('/terms/accept');
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const completeProfile = async (data: UpdateProfileRequest): Promise<CurrentUserResponse> => {
    await apiClient.put('/users/profile', data);
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const refetchUser = async (): Promise<CurrentUserResponse | null> => {
    const res = await refetch();
    return res.data ?? null;
  };

  const user = authData?.user ?? null;
  const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem('app_role_code') as RoleCode | null) : null;
  const roleCode = (authData?.roleCode as RoleCode) ?? cachedRole ?? null;

  React.useEffect(() => {
    if (authData?.roleCode) {
      try {
        localStorage.setItem('app_role_code', authData.roleCode);
      } catch (_err) {
        // Ignore localStorage errors
      }
    }
  }, [authData?.roleCode]);
  const profileComplete = authData?.profileComplete ?? false;
  const termsAccepted = authData?.termsAccepted ?? false;
  const isAuthenticated = Boolean(user && roleCode);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
