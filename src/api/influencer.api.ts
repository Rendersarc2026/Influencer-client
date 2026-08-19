import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  InfluencerMapperResponse,
  CampaignMapperListQuery,
  CampaignResponse,
  CampaignListQuery,
  SubmitRateRequest,
  UpdateProfileRequest,
  UserResponse,
  PaginatedResult,
} from '@contracts';

export function useInfluencerCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    queryKey: ['influencer', 'campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>(
        '/influencer/campaigns',
        { params },
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useInfluencerAssignments(params?: CampaignMapperListQuery) {
  return useQuery<PaginatedResult<InfluencerMapperResponse>>({
    queryKey: ['influencer', 'assignments', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<InfluencerMapperResponse>>(
        '/influencer/assignments',
        { params },
      );
      return response.data;
    },
    // Keep the current page on screen while the next one loads — the table
    // shows its backlit refetch state instead of collapsing to a skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useInfluencerAssignment(assignmentId: string | undefined) {
  return useQuery<InfluencerMapperResponse>({
    queryKey: ['influencer', 'assignments', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID required');
      const response = await apiClient.get<InfluencerMapperResponse>(
        `/influencer/assignments/${assignmentId}`,
      );
      return response.data;
    },
    enabled: Boolean(assignmentId),
  });
}

export function useSubmitInfluencerRate(assignmentId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    InfluencerMapperResponse,
    Error,
    { mapperId: string; data: SubmitRateRequest }
  >({
    mutationFn: async ({ mapperId, data }) => {
      const response = await apiClient.post<InfluencerMapperResponse>(
        `/influencer/assignments/${mapperId}/rate`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      if (assignmentId) {
        queryClient.invalidateQueries({ queryKey: ['influencer', 'assignments', assignmentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['influencer', 'assignments'] });
    },
  });
}

export function useUpdateInfluencerProfile() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.put<UserResponse>('/users/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
