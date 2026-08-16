import { z } from 'zod';
import { money, safeMultilineText } from './primitives';
import { RateStatusEnum, BrandStatusEnum } from './enums';

// -------------------------------------------------------------
// Response Shapes per Role
// -------------------------------------------------------------

// Brand view: MUST NEVER CONTAIN influencerRate or margin
export const BrandMapperResponseSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  influencerId: z.string().uuid(),
  influencerName: z.string(),
  clientRate: z.number().nullable(),
  currency: z.string(),
  brandStatus: BrandStatusEnum,
  deliverables: z.string().nullable(),
  brandDecidedOn: z.date().nullable(),
  createdOn: z.date(),
});
export type BrandMapperResponse = z.infer<typeof BrandMapperResponseSchema>;

// Influencer view: contains influencerRate, but NOT margin or clientRate
export const InfluencerMapperResponseSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  influencerId: z.string().uuid(),
  influencerRate: z.number().nullable(),
  currency: z.string(),
  rateStatus: RateStatusEnum,
  deliverables: z.string().nullable(),
  createdOn: z.date(),
});
export type InfluencerMapperResponse = z.infer<typeof InfluencerMapperResponseSchema>;

// Agency / Admin view: full transparency
export const AgencyMapperResponseSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  influencerId: z.string().uuid(),
  influencerName: z.string().optional(),
  influencerRate: z.number().nullable(),
  margin: z.number().nullable(),
  clientRate: z.number().nullable(),
  currency: z.string(),
  rateStatus: RateStatusEnum,
  brandStatus: BrandStatusEnum,
  budgetVisible: z.boolean(),
  rateApprovedBy: z.string().uuid().nullable(),
  rateApprovedOn: z.date().nullable(),
  brandDecidedOn: z.date().nullable(),
  deliverables: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type AgencyMapperResponse = z.infer<typeof AgencyMapperResponseSchema>;

// -------------------------------------------------------------
// Request Shapes
// -------------------------------------------------------------

export const AddInfluencerToCampaignSchema = z.object({
  influencerId: z.string().uuid(),
  deliverables: safeMultilineText(2000).optional(),
});
export type AddInfluencerToCampaignRequest = z.infer<typeof AddInfluencerToCampaignSchema>;

export const SubmitRateRequestSchema = z.object({
  influencerRate: money.refine((v) => v > 0, 'Rate must be greater than 0'),
  note: safeMultilineText(2000).optional(),
});
export type SubmitRateRequest = z.infer<typeof SubmitRateRequestSchema>;

export const RequestRateRevisionRequestSchema = z.object({
  comment: safeMultilineText(2000),
});
export type RequestRateRevisionRequest = z.infer<typeof RequestRateRevisionRequestSchema>;

export const ApproveRateRequestSchema = z.object({
  margin: money,
  influencerRate: money.optional(),
});
export type ApproveRateRequest = z.infer<typeof ApproveRateRequestSchema>;

export const BrandDecisionRequestSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CORRECTION']),
    comment: safeMultilineText(2000).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.action === 'REJECT' || data.action === 'REQUEST_CORRECTION') &&
        (!data.comment || data.comment.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'A comment is mandatory when rejecting or requesting correction',
      path: ['comment'],
    },
  );
export type BrandDecisionRequest = z.infer<typeof BrandDecisionRequestSchema>;

export const CampaignMapperListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  campaignId: z.string().uuid().optional(),
  influencerId: z.string().uuid().optional(),
  rateStatus: z.string().optional(),
  brandStatus: z.string().optional(),
});
export type CampaignMapperListQuery = z.infer<typeof CampaignMapperListQuerySchema>;
