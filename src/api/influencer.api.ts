import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import { invalidateEntity } from './invalidate';
import {
  InfluencerMapperResponse,
  CampaignMapperListQuery,
  CampaignResponse,
  CampaignListQuery,
  SubmitRateRequest,
  UpdateProfileRequest,
  UserResponse,
  PaginatedResult,
  InfluencerDashboardSummary,
} from '@contracts';

/**
 * The creator home tiles, aggregated in Postgres. The page used to fetch every
 * assignment it had ever been given to count three of them and sum a fourth.
 */
export function influencerDashboardSummaryQueryOptions() {
  return {
    queryKey: ['influencer', 'dashboard', 'summary'] as const,
    queryFn: async () => {
      const response = await apiClient.get<InfluencerDashboardSummary>(
        '/influencer/dashboard/summary',
      );
      return response.data;
    },
  };
}

export function useInfluencerDashboardSummary() {
  return useQuery<InfluencerDashboardSummary>({
    ...influencerDashboardSummaryQueryOptions(),
    staleTime: 1000 * 60,
  });
}

export function influencerCampaignsQueryOptions(params?: CampaignListQuery) {
  return {
    queryKey: ['influencer', 'campaigns', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>(
        '/influencer/campaigns',
        { params },
      );
      return response.data;
    },
  };
}

export function useInfluencerCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    ...influencerCampaignsQueryOptions(params),
    placeholderData: keepPreviousData,
  });
}

export function influencerAssignmentsQueryOptions(params?: CampaignMapperListQuery) {
  return {
    queryKey: ['influencer', 'assignments', params] as const,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<InfluencerMapperResponse>>(
        '/influencer/assignments',
        { params },
      );
      return response.data;
    },
  };
}

export function useInfluencerAssignments(params?: CampaignMapperListQuery) {
  return useQuery<PaginatedResult<InfluencerMapperResponse>>({
    ...influencerAssignmentsQueryOptions(params),
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
      invalidateEntity(queryClient, 'assignment');
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
      invalidateEntity(queryClient, 'profile');
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
