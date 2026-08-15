import { z } from 'zod';
import { httpUrl, safeMultilineText, safeText } from './primitives';
import { CampaignStatusEnum } from './enums';

export const CampaignResponseSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  briefUrl: z.string().nullable(),
  status: CampaignStatusEnum,
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type CampaignResponse = z.infer<typeof CampaignResponseSchema>;

export const CreateCampaignSchema = z.object({
  brandId: z.string().uuid(),
  name: safeText(200),
  description: safeMultilineText(5000).optional(),
  briefUrl: httpUrl.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z.object({
  name: safeText(200).optional(),
  description: safeMultilineText(5000).optional(),
  briefUrl: httpUrl.optional(),
  status: CampaignStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignSchema>;

export const CampaignListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  brandId: z.string().uuid().optional(),
  status: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;
