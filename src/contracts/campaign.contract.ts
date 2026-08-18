import { z } from 'zod';
import { httpUrl, safeMultilineText, safeText } from './primitives';
import { CampaignStatusEnum, CampaignStatusQuery } from './enums';

export const CampaignResponseSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  /** Joined in on read so a list does not have to fetch brands separately. */
  brandName: z.string().nullable(),
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

export const CreateCampaignSchema = z
  .object({
    brandId: z.string().uuid(),
    name: safeText(200),
    description: safeMultilineText(5000, 0).optional(),
    briefUrl: httpUrl.optional().or(z.literal('')),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });
export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z
  .object({
    name: safeText(200).optional(),
    description: safeMultilineText(5000, 0).optional().nullable(),
    briefUrl: httpUrl.optional().nullable().or(z.literal('')),
    status: CampaignStatusEnum.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );
export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignSchema>;

export const CampaignListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  brandId: z.string().uuid().optional(),
  status: CampaignStatusQuery.optional(),
  isActive: z.coerce.boolean().optional(),
});
export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;
