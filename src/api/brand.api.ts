import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  CampaignResponse,
  CampaignListQuery,
  BrandMapperResponse,
  CampaignMapperListQuery,
  BrandDecisionRequest,
  PaymentResponse,
  PaymentListQuery,
  PaginatedResult,
} from '@contracts';

export function useBrandCampaigns(params?: CampaignListQuery) {
  return useQuery<PaginatedResult<CampaignResponse>>({
    queryKey: ['brand', 'campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<CampaignResponse>>('/brand/campaigns', {
        params,
      });
      return response.data;
    },
    // Keep the current page on screen while the next one loads — the table
    // shows its backlit refetch state instead of collapsing to a skeleton.
    placeholderData: keepPreviousData,
  });
}

export function useBrandCampaign(campaignId: string | undefined) {
  return useQuery<CampaignResponse>({
    queryKey: ['brand', 'campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<CampaignResponse>(`/brand/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: Boolean(campaignId),
  });
}

export function useBrandCampaignInfluencers(
  campaignId: string | undefined,
  params?: CampaignMapperListQuery,
) {
  return useQuery<PaginatedResult<BrandMapperResponse>>({
    queryKey: ['brand', 'campaigns', campaignId, 'influencers', params],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<PaginatedResult<BrandMapperResponse>>(
        `/brand/campaigns/${campaignId}/influencers`,
        { params },
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
    placeholderData: keepPreviousData,
  });
}

export function useBrandDecision(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    BrandMapperResponse,
    Error,
    { mapperId: string; decision: BrandDecisionRequest }
  >({
    mutationFn: async ({ mapperId, decision }) => {
      const response = await apiClient.post<BrandMapperResponse>(
        `/brand/mappers/${mapperId}/decision`,
        decision,
      );
      return response.data;
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['brand', 'campaigns'] });
    },
  });
}

export function useBrandPayments(params?: PaymentListQuery) {
  return useQuery<PaginatedResult<PaymentResponse>>({
    queryKey: ['brand', 'payments', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<PaymentResponse>>('/brand/payments', {
        params,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  return useMutation<PaymentResponse, Error, string>({
    mutationFn: async (paymentId) => {
      const response = await apiClient.post<PaymentResponse>(
        `/brand/payments/${paymentId}/approve`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', 'payments'] });
    },
  });
}
