import { z } from 'zod';

/**
 * Every coded value in the system, as integers.
 *
 * Statuses are stored, filtered and transported as small integers, never as
 * text. A code is numbered from 1 *within its own category*, so it is only
 * meaningful next to that category: CAMPAIGN_STATUS 1 is DRAFT while
 * RATE_STATUS 1 is PENDING_SUBMISSION. Nothing is ever numbered 0 — a zero
 * would be indistinguishable from an unset integer column.
 *
 * These constants are the single source of truth. The `enum_code` table mirrors
 * them for lookup, and `src/domain/types` mirrors the numeric unions for the
 * domain layer (which may not import contracts);
 * `tests/contracts/enum-codes.test.ts` fails if the copies drift apart.
 *
 * This file is shipped to the client by `scripts/export-contracts.sh`, so it
 * must not import from anywhere outside `src/contracts`.
 */

/** The category names used by the `enum_code` registry. */
export const EnumCategory = {
  ROLE: 'ROLE',
  CAMPAIGN_STATUS: 'CAMPAIGN_STATUS',
  RATE_STATUS: 'RATE_STATUS',
  BRAND_STATUS: 'BRAND_STATUS',
  PAYMENT_STATUS: 'PAYMENT_STATUS',
  CHAT_TYPE: 'CHAT_TYPE',
  APPROVAL_ACTION: 'APPROVAL_ACTION',
  CATEGORY_TYPE: 'CATEGORY_TYPE',
} as const;
export type EnumCategory = (typeof EnumCategory)[keyof typeof EnumCategory];

/**
 * Flips a code map into `code -> symbolic name`.
 *
 * Only for human-facing output — error messages, logs, labels. Code that
 * branches on a status compares against the code constants, so renaming a
 * symbol stays a compile-time concern.
 */
function nameLookup<T extends Record<string, number>>(codes: T): Readonly<Record<number, string>> {
  const byCode: Record<number, string> = {};
  for (const [name, code] of Object.entries(codes)) {
    byCode[code] = name;
  }
  return Object.freeze(byCode);
}

// -------------------------------------------------------------
// Campaign status
// -------------------------------------------------------------

export const CampaignStatusCode = {
  DRAFT: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;
export type CampaignStatus = (typeof CampaignStatusCode)[keyof typeof CampaignStatusCode];
export const CampaignStatusEnum = z.nativeEnum(CampaignStatusCode);
export const CampaignStatusName = nameLookup(CampaignStatusCode);

// -------------------------------------------------------------
// Rate status — the agency-side rate negotiation
// -------------------------------------------------------------

export const RateStatusCode = {
  PENDING_SUBMISSION: 1,
  SUBMITTED: 2,
  REVISION_REQUESTED: 3,
  AGENCY_APPROVED: 4,
} as const;
export type RateStatus = (typeof RateStatusCode)[keyof typeof RateStatusCode];
export const RateStatusEnum = z.nativeEnum(RateStatusCode);
export const RateStatusName = nameLookup(RateStatusCode);

// -------------------------------------------------------------
// Brand status — the brand-side approval of an approved rate
// -------------------------------------------------------------

export const BrandStatusCode = {
  NOT_VISIBLE: 1,
  PENDING_REVIEW: 2,
  CORRECTION_REQUESTED: 3,
  APPROVED: 4,
  REJECTED: 5,
} as const;
export type BrandStatus = (typeof BrandStatusCode)[keyof typeof BrandStatusCode];
export const BrandStatusEnum = z.nativeEnum(BrandStatusCode);
export const BrandStatusName = nameLookup(BrandStatusCode);

// -------------------------------------------------------------
// Payment status
// -------------------------------------------------------------

export const PaymentStatusCode = {
  NOT_RAISED: 1,
  PENDING_APPROVAL: 2,
  APPROVED: 3,
  REJECTED: 4,
} as const;
export type PaymentStatus = (typeof PaymentStatusCode)[keyof typeof PaymentStatusCode];
export const PaymentStatusEnum = z.nativeEnum(PaymentStatusCode);
export const PaymentStatusName = nameLookup(PaymentStatusCode);

// -------------------------------------------------------------
// Chat type
// -------------------------------------------------------------

export const ChatTypeCode = {
  AGENCY_BRAND: 1,
  AGENCY_INFLUENCER: 2,
} as const;
export type ChatType = (typeof ChatTypeCode)[keyof typeof ChatTypeCode];
export const ChatTypeEnum = z.nativeEnum(ChatTypeCode);
export const ChatTypeName = nameLookup(ChatTypeCode);

// -------------------------------------------------------------
// Approval action — what an approval_event row records
// -------------------------------------------------------------

export const ApprovalActionCode = {
  RATE_SUBMITTED: 1,
  RATE_REVISION_REQUESTED: 2,
  RATE_APPROVED: 3,
  BRAND_APPROVED: 4,
  BRAND_REJECTED: 5,
  BRAND_CORRECTION_REQUESTED: 6,
  PAYMENT_APPROVED: 7,
  PAYMENT_REJECTED: 8,
} as const;
export type ApprovalAction = (typeof ApprovalActionCode)[keyof typeof ApprovalActionCode];
export const ApprovalActionEnum = z.nativeEnum(ApprovalActionCode);
export const ApprovalActionName = nameLookup(ApprovalActionCode);

// -------------------------------------------------------------
// Category type
// -------------------------------------------------------------

export const CategoryTypeCode = {
  BRAND: 1,
  INFLUENCER: 2,
} as const;
export type CategoryType = (typeof CategoryTypeCode)[keyof typeof CategoryTypeCode];
export const CategoryTypeEnum = z.nativeEnum(CategoryTypeCode);
export const CategoryTypeName = nameLookup(CategoryTypeCode);

// -------------------------------------------------------------
// Role
// -------------------------------------------------------------

/**
 * Three roles, no admin. `role.code` stays symbolic because it is a natural key
 * referenced by seeds and navigation, but the numeric code is registered here so
 * the registry describes every category.
 */
export const RoleCodeValue = {
  AGENCY: 1,
  BRAND: 2,
  INFLUENCER: 3,
} as const;
export const RoleCodeName = nameLookup(RoleCodeValue);

// -------------------------------------------------------------
// Actions — request verbs, not stored state
// -------------------------------------------------------------

/**
 * Transition verbs stay symbolic. They are never persisted and never read back:
 * a caller names the transition it wants in a request body and the state machine
 * turns it into a stored status code. Keeping them as text keeps the API
 * self-describing where there is no column to keep narrow.
 */
export const RateActionEnum = z.enum(['SUBMIT_RATE', 'REQUEST_REVISION', 'APPROVE_RATE', 'REVERT_APPROVAL']);
export type RateAction = z.infer<typeof RateActionEnum>;

export const BrandActionEnum = z.enum([
  'SUBMIT_FOR_REVIEW',
  'REQUEST_CORRECTION',
  'APPROVE',
  'REJECT',
]);
export type BrandAction = z.infer<typeof BrandActionEnum>;

// -------------------------------------------------------------
// Query-string variants
// -------------------------------------------------------------

/**
 * Codes arrive from a query string as text (`?rateStatus=4`), so filters coerce
 * before validating. The body schemas above do not coerce: a request body is
 * JSON, where a status must already be a number.
 */
const asCode = z.coerce.number().int();

export const CampaignStatusQuery = asCode.pipe(CampaignStatusEnum);
export const RateStatusQuery = asCode.pipe(RateStatusEnum);
export const BrandStatusQuery = asCode.pipe(BrandStatusEnum);
export const PaymentStatusQuery = asCode.pipe(PaymentStatusEnum);
export const CategoryTypeQuery = asCode.pipe(CategoryTypeEnum);

/**
 * Every category's codes in one place, for the registry seeder and the drift
 * test. Keys match `EnumCategory`.
 */
export const ENUM_CODE_REGISTRY: Readonly<Record<EnumCategory, Readonly<Record<string, number>>>> =
  Object.freeze({
    ROLE: RoleCodeValue,
    CAMPAIGN_STATUS: CampaignStatusCode,
    RATE_STATUS: RateStatusCode,
    BRAND_STATUS: BrandStatusCode,
    PAYMENT_STATUS: PaymentStatusCode,
    CHAT_TYPE: ChatTypeCode,
    APPROVAL_ACTION: ApprovalActionCode,
    CATEGORY_TYPE: CategoryTypeCode,
  });
