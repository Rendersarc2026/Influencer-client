import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  AgencyResponse,
  CreateAgencyRequest,
  UpdateAgencyRequest,
  BrandResponse,
  CreateBrandRequest,
  UpdateBrandRequest,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@contracts';

// -------------------------------------------------------------
// 1. Agencies
// -------------------------------------------------------------

export function useAdminAgencies() {
  return useQuery<AgencyResponse[]>({
    queryKey: ['admin', 'agencies'],
    queryFn: async () => {
      const response = await apiClient.get<AgencyResponse[]>('/admin/agencies');
      return response.data;
    },
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();
  return useMutation<AgencyResponse, Error, CreateAgencyRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<AgencyResponse>('/admin/agencies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  return useMutation<AgencyResponse, Error, { id: string; data: UpdateAgencyRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<AgencyResponse>(`/admin/agencies/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

export function useDeactivateAgency() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/agencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });
    },
  });
}

// -------------------------------------------------------------
// 2. Brands
// -------------------------------------------------------------

export function useAdminBrands() {
  return useQuery<BrandResponse[]>({
    queryKey: ['admin', 'brands'],
    queryFn: async () => {
      const response = await apiClient.get<BrandResponse[]>('/admin/brands');
      return response.data;
    },
  });
}

export function useAdminCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, CreateBrandRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BrandResponse>('/admin/brands', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

export function useAdminUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation<BrandResponse, Error, { id: string; data: UpdateBrandRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BrandResponse>(`/admin/brands/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

export function useAdminDeactivateBrand() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    },
  });
}

// -------------------------------------------------------------
// 3. Users
// -------------------------------------------------------------

export function useAdminUsers() {
  return useQuery<UserResponse[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiClient.get<UserResponse[]>('/admin/users');
      return response.data;
    },
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<UserResponse>('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, { id: string; data: UpdateUserRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<UserResponse>(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminResendInvite() {
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (email) => {
      const response = await apiClient.post<{ message: string }>('/auth/otp/request', { email });
      return response.data;
    },
  });
}
