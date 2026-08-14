import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  CampaignResponse,
  BrandMapperResponse,
  BrandDecisionRequest,
  PaymentResponse,
} from '@contracts';

export function useBrandCampaigns() {
  return useQuery<CampaignResponse[]>({
    queryKey: ['brand', 'campaigns'],
    queryFn: async () => {
      const response = await apiClient.get<CampaignResponse[]>('/brand/campaigns');
      return response.data;
    },
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

export function useBrandCampaignInfluencers(campaignId: string | undefined) {
  return useQuery<BrandMapperResponse[]>({
    queryKey: ['brand', 'campaigns', campaignId, 'influencers'],
    queryFn: async () => {
      if (!campaignId) throw new Error('Campaign ID required');
      const response = await apiClient.get<BrandMapperResponse[]>(
        `/brand/campaigns/${campaignId}/influencers`,
      );
      return response.data;
    },
    enabled: Boolean(campaignId),
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

export function useBrandPayments() {
  return useQuery<PaymentResponse[]>({
    queryKey: ['brand', 'payments'],
    queryFn: async () => {
      const response = await apiClient.get<PaymentResponse[]>('/brand/payments');
      return response.data;
    },
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
