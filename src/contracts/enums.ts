import { z } from 'zod';

export const CampaignStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

export const RateStatusEnum = z.enum([
  'PENDING_SUBMISSION',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'AGENCY_APPROVED',
]);
export type RateStatus = z.infer<typeof RateStatusEnum>;

export const BrandStatusEnum = z.enum([
  'NOT_VISIBLE',
  'PENDING_REVIEW',
  'CORRECTION_REQUESTED',
  'APPROVED',
  'REJECTED',
]);
export type BrandStatus = z.infer<typeof BrandStatusEnum>;

export const PaymentStatusEnum = z.enum(['NOT_RAISED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ChatTypeEnum = z.enum(['AGENCY_BRAND', 'AGENCY_INFLUENCER']);
export type ChatType = z.infer<typeof ChatTypeEnum>;

export const ApprovalActionEnum = z.enum([
  'RATE_SUBMITTED',
  'RATE_REVISION_REQUESTED',
  'RATE_APPROVED',
  'BRAND_APPROVED',
  'BRAND_REJECTED',
  'BRAND_CORRECTION_REQUESTED',
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
]);
export type ApprovalAction = z.infer<typeof ApprovalActionEnum>;

export const RateActionEnum = z.enum(['SUBMIT_RATE', 'REQUEST_REVISION', 'APPROVE_RATE']);
export type RateAction = z.infer<typeof RateActionEnum>;

export const BrandActionEnum = z.enum([
  'SUBMIT_FOR_REVIEW',
  'REQUEST_CORRECTION',
  'APPROVE',
  'REJECT',
]);
export type BrandAction = z.infer<typeof BrandActionEnum>;
