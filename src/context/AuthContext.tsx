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
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes — serve from cache, no shimmer on revisit
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
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const acceptTerms = async (): Promise<CurrentUserResponse> => {
    try {
      await apiClient.post('/terms/accept');
    } catch {
      // Fallback
    }
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const completeProfile = async (data: UpdateProfileRequest): Promise<CurrentUserResponse> => {
    try {
      await apiClient.put('/users/profile', data);
    } catch {
      // Fallback
    }
    const meRes = await apiClient.get<CurrentUserResponse>('/auth/me');
    queryClient.setQueryData(['auth', 'me'], meRes.data);
    return meRes.data;
  };

  const refetchUser = async (): Promise<CurrentUserResponse | null> => {
    const res = await refetch();
    return res.data ?? null;
  };

  const user = authData?.user ?? null;
  const roleCode = (authData?.roleCode as RoleCode) ?? null;
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
