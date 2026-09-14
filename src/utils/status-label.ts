import {
  EnumCategory,
  CampaignStatusCode,
  RateStatusCode,
  BrandStatusCode,
  PaymentStatusCode,
} from '@contracts';

export type StatusCategory = Extract<
  EnumCategory,
  'CAMPAIGN_STATUS' | 'RATE_STATUS' | 'BRAND_STATUS' | 'PAYMENT_STATUS'
>;

export type StatusTone = 'neutral' | 'progress' | 'warning' | 'positive' | 'negative';

export interface StatusConfig {
  label: string;
  tone: StatusTone;
}

export const STATUS_CONFIG: Record<StatusCategory, Record<number, StatusConfig>> = {
  CAMPAIGN_STATUS: {
    [CampaignStatusCode.DRAFT]: { label: 'Draft', tone: 'neutral' },
    [CampaignStatusCode.ACTIVE]: { label: 'Active', tone: 'positive' },
    [CampaignStatusCode.COMPLETED]: { label: 'Completed', tone: 'progress' },
    [CampaignStatusCode.CANCELLED]: { label: 'Cancelled', tone: 'negative' },
  },
  RATE_STATUS: {
    [RateStatusCode.PENDING_SUBMISSION]: { label: 'Pending Submission', tone: 'warning' },
    [RateStatusCode.SUBMITTED]: { label: 'Submitted', tone: 'progress' },
    [RateStatusCode.REVISION_REQUESTED]: { label: 'Revision Requested', tone: 'warning' },
    [RateStatusCode.AGENCY_APPROVED]: { label: 'Approved', tone: 'positive' },
  },
  BRAND_STATUS: {
    [BrandStatusCode.NOT_VISIBLE]: { label: 'Draft Proposal', tone: 'neutral' },
    [BrandStatusCode.PENDING_REVIEW]: { label: 'Pending Review', tone: 'warning' },
    [BrandStatusCode.CORRECTION_REQUESTED]: { label: 'Correction Requested', tone: 'warning' },
    [BrandStatusCode.APPROVED]: { label: 'Approved', tone: 'positive' },
    [BrandStatusCode.REJECTED]: { label: 'Rejected', tone: 'negative' },
  },
  PAYMENT_STATUS: {
    [PaymentStatusCode.NOT_RAISED]: { label: 'Not Raised', tone: 'neutral' },
    [PaymentStatusCode.PENDING_APPROVAL]: { label: 'Pending Approval', tone: 'warning' },
    [PaymentStatusCode.APPROVED]: { label: 'Approved', tone: 'positive' },
    [PaymentStatusCode.REJECTED]: { label: 'Rejected', tone: 'negative' },
  },
};

/**
 * Who is reading a rate status.
 *
 * A rate moves between two parties, so one code describes two different
 * situations. `SUBMITTED` on the agency's roster meant the *creator* sent their
 * rate in and the agency now owes an approval — but a column headed "Agency
 * Status" reading "Submitted" says the opposite of that. The wording is chosen
 * per audience; the code is the same on both sides.
 */
export type StatusPerspective = 'AGENCY' | 'INFLUENCER';

const RATE_STATUS_BY_PERSPECTIVE: Record<StatusPerspective, Record<number, StatusConfig>> = {
  // The agency's own position in the workflow: what it is waiting on, and what
  // it owes. Parallel to the BRAND_STATUS wording in the same table.
  AGENCY: {
    [RateStatusCode.PENDING_SUBMISSION]: { label: 'Awaiting Rate', tone: 'warning' },
    [RateStatusCode.SUBMITTED]: { label: 'Pending Approval', tone: 'progress' },
    [RateStatusCode.REVISION_REQUESTED]: { label: 'Revision Requested', tone: 'warning' },
    [RateStatusCode.AGENCY_APPROVED]: { label: 'Approved', tone: 'positive' },
  },
  // The creator's own position, matching the filter pills on their brief list —
  // the chip and the pill that selects it have to read the same.
  INFLUENCER: {
    [RateStatusCode.PENDING_SUBMISSION]: { label: 'Action Required', tone: 'warning' },
    [RateStatusCode.SUBMITTED]: { label: 'Under Review', tone: 'progress' },
    [RateStatusCode.REVISION_REQUESTED]: { label: 'Needs Revision', tone: 'warning' },
    [RateStatusCode.AGENCY_APPROVED]: { label: 'Approved', tone: 'positive' },
  },
};

/**
 * One status's label and tone, worded for whoever is reading it.
 *
 * Only RATE_STATUS is audience-dependent; every other category means the same
 * thing to everyone and ignores `perspective`.
 */
export function getStatusConfig(
  category: StatusCategory,
  code: number | null | undefined,
  perspective?: StatusPerspective,
): StatusConfig | undefined {
  if (code === null || code === undefined) return undefined;
  if (category === 'RATE_STATUS' && perspective) {
    return RATE_STATUS_BY_PERSPECTIVE[perspective][code] ?? STATUS_CONFIG[category]?.[code];
  }
  return STATUS_CONFIG[category]?.[code];
}

export function getStatusLabel(
  category: StatusCategory,
  code: number | null | undefined,
  perspective?: StatusPerspective,
): string {
  const config = getStatusConfig(category, code, perspective);
  if (config) return config.label;
  return code === null || code === undefined ? '—' : `Unknown (${code})`;
}

export type DeliverableStatus =
  'Briefed' | 'Content Shared' | 'Content Approved' | 'Live' | 'Completed';

/**
 * Calculates where the deliverable stands in the campaign lifecycle:
 * Briefed / Content Shared / Content Approved / Live / Completed
 */
export function getDeliverableStatus(row: {
  rateStatus?: number | null;
  brandStatus?: number | null;
  hasMetrics?: boolean;
  hasLiveLink?: boolean;
  campaignStatus?: number | string | null;
}): DeliverableStatus {
  if (
    row.campaignStatus === CampaignStatusCode.COMPLETED ||
    row.campaignStatus === 'COMPLETED' ||
    row.hasMetrics
  ) {
    return 'Completed';
  }
  if (row.hasLiveLink) {
    return 'Live';
  }
  if (
    row.brandStatus === BrandStatusCode.APPROVED &&
    row.rateStatus === RateStatusCode.AGENCY_APPROVED
  ) {
    return 'Content Approved';
  }
  if (
    row.brandStatus === BrandStatusCode.PENDING_REVIEW ||
    row.rateStatus === RateStatusCode.SUBMITTED ||
    row.rateStatus === RateStatusCode.REVISION_REQUESTED
  ) {
    return 'Content Shared';
  }
  return 'Briefed';
}
