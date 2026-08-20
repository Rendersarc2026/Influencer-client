import { z } from 'zod';

/**
 * Headline numbers for a home screen.
 *
 * Every one of these was previously derived in the browser by downloading the
 * rows behind it — the agency screen fetched every campaign, every brand and a
 * full report per campaign to render four tiles. They are computed in Postgres
 * now (see the `*_dashboard_summary` functions), so a home screen costs one
 * small response instead of the whole tenant's data.
 */
export const AgencyDashboardSummarySchema = z.object({
  totalCampaigns: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  completedCampaigns: z.number().int().nonnegative(),
  totalBrands: z.number().int().nonnegative(),
  totalInfluencers: z.number().int().nonnegative(),
  totalAssignments: z.number().int().nonnegative(),
  /** Rates a creator has submitted and the agency has not yet acted on. */
  pendingRateApprovals: z.number().int().nonnegative(),
  /** Assignments sitting in the brand's review queue. */
  awaitingBrandReview: z.number().int().nonnegative(),
  totalInfluencerRate: z.number().nonnegative(),
  totalClientRate: z.number().nonnegative(),
  totalMargin: z.number(),
  totalReach: z.number().int().nonnegative(),
  totalEngagements: z.number().int().nonnegative(),
  avgErPercent: z.number().nonnegative(),
});
export type AgencyDashboardSummary = z.infer<typeof AgencyDashboardSummarySchema>;

export const BrandDashboardSummarySchema = z.object({
  totalCampaigns: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  completedCampaigns: z.number().int().nonnegative(),
  totalInfluencers: z.number().int().nonnegative(),
  pendingApprovals: z.number().int().nonnegative(),
  approvedInfluencers: z.number().int().nonnegative(),
  pendingPayments: z.number().int().nonnegative(),
  totalSpend: z.number().nonnegative(),
  totalReach: z.number().int().nonnegative(),
  totalEngagements: z.number().int().nonnegative(),
  avgErPercent: z.number().nonnegative(),
});
export type BrandDashboardSummary = z.infer<typeof BrandDashboardSummarySchema>;

export const InfluencerDashboardSummarySchema = z.object({
  totalAssignments: z.number().int().nonnegative(),
  activeAssignments: z.number().int().nonnegative(),
  pendingRates: z.number().int().nonnegative(),
  submittedRates: z.number().int().nonnegative(),
  approvedRates: z.number().int().nonnegative(),
  completedCampaigns: z.number().int().nonnegative(),
  totalEarnings: z.number().nonnegative(),
});
export type InfluencerDashboardSummary = z.infer<typeof InfluencerDashboardSummarySchema>;

/**
 * The distinct categories and locations the agency's own creators actually use.
 * The creators screen builds its filter dropdowns from these; it used to build
 * them by fetching every creator row and de-duplicating client-side.
 */
export const InfluencerFilterOptionsSchema = z.object({
  categories: z.array(z.string()),
  locations: z.array(z.string()),
});
export type InfluencerFilterOptions = z.infer<typeof InfluencerFilterOptionsSchema>;

/**
 * One campaign's figures, straight from the `campaign_rollup` view.
 *
 * The reports screen used to assemble this by asking for a full report per
 * campaign - every mapper row included, and capped at 100 campaigns per
 * request. It only ever rendered the totals, so only the totals travel.
 */
export const CampaignRollupSchema = z.object({
  campaignId: z.string().uuid(),
  campaignName: z.string(),
  brandId: z.string().uuid(),
  brandName: z.string(),
  status: z.number().int(),
  influencerCount: z.number().int().nonnegative(),
  pendingRateCount: z.number().int().nonnegative(),
  awaitingBrandCount: z.number().int().nonnegative(),
  totalInfluencerRate: z.number(),
  totalClientRate: z.number(),
  totalMargin: z.number(),
  totalReach: z.number().int().nonnegative(),
  totalEngagements: z.number().int().nonnegative(),
  avgErPercent: z.number().nonnegative(),
});
export type CampaignRollup = z.infer<typeof CampaignRollupSchema>;
