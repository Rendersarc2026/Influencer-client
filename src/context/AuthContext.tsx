import React, { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@api';
import {
  CurrentUserResponse,
  RoleCode,
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
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
  } = useQuery<CurrentUserResponse>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<CurrentUserResponse>('/auth/me');
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (data: RequestOtpRequest) => {
      const response = await apiClient.post<RequestOtpResponse>('/auth/otp/request', data);
      return response.data;
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await apiClient.post<VerifyOtpResponse>('/auth/otp/verify', data);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refetch();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const requestOtp = async (email: string): Promise<RequestOtpResponse> => {
    return requestOtpMutation.mutateAsync({ email });
  };

  const verifyOtp = async (email: string, code: string): Promise<VerifyOtpResponse> => {
    return verifyOtpMutation.mutateAsync({ email, code });
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const acceptTerms = async (): Promise<void> => {
    try {
      await apiClient.post('/terms/accept');
    } catch {
      // Fallback
    }
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await refetch();
  };

  const completeProfile = async (data: UpdateProfileRequest): Promise<void> => {
    try {
      await apiClient.put('/users/profile', data);
    } catch {
      // Fallback
    }
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await refetch();
  };

  const refetchUser = async (): Promise<void> => {
    await refetch();
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
