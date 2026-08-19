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
    [RateStatusCode.AGENCY_APPROVED]: { label: 'Agency Approved', tone: 'positive' },
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

export function getStatusLabel(
  category: StatusCategory,
  code: number | null | undefined,
): string {
  if (code !== null && code !== undefined && STATUS_CONFIG[category]?.[code]) {
    return STATUS_CONFIG[category][code].label;
  }
  return code === null || code === undefined ? '—' : `Unknown (${code})`;
}
