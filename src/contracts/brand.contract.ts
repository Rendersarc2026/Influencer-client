import { z } from 'zod';
import { boolQuery, email, httpUrl, limit, page, phone, safeMultilineText, safeText, personName } from './primitives';

export const BrandResponseSchema = z.object({
  id: z.string().uuid(),
  /** The agency that created and owns this brand. */
  agencyId: z.string().uuid(),
  name: z.string(),
  industry: z.string().nullable(),
  contactPerson: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  logoUrl: z.string().nullable(),
  bio: z.string().nullable().optional(),
  profileCompletedOn: z.date().nullable().optional(),
  isActive: z.boolean(),
  createdOn: z.date(),
  updatedOn: z.date().optional(),
});
export type BrandResponse = z.infer<typeof BrandResponseSchema>;

/**
 * The owning agency is never part of the payload: it is taken from the acting
 * user's token, so a caller cannot create a brand under someone else's agency.
 */
export const CreateBrandSchema = z.object({
  name: safeText(200),
  industry: safeText(120).optional(),
  contactPerson: personName(200).optional(),
  /**
   * Both are mandatory on creation: the pair becomes the brand manager's login
   * (see AgencyBrandUseCases.create, which provisions a BRAND user from them),
   * and an account with no way to reach its owner is not worth creating.
   */
  contactPhone: phone,
  contactEmail: email,
  website: httpUrl.optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  logoUrl: httpUrl.optional(),
  bio: safeMultilineText(2000).optional(),
});
export type CreateBrandRequest = z.infer<typeof CreateBrandSchema>;

/** Ownership is fixed at creation, so it is absent here too. */
export const UpdateBrandSchema = z.object({
  name: safeText(200).optional(),
  industry: safeText(120).optional(),
  contactPerson: personName(200).optional(),
  contactPhone: phone.optional(),
  contactEmail: email.optional(),
  website: httpUrl.optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  logoUrl: httpUrl.optional(),
  bio: safeMultilineText(2000).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBrandRequest = z.infer<typeof UpdateBrandSchema>;

export const BrandStatusFilterSchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'boolean') {
    return val ? 'ACTIVE' : 'INACTIVE';
  }
  const str = String(val).trim().toUpperCase();
  const normalized = str.replace(/[\s+_,&/-]+/g, '_');
  if (
    normalized === 'INACTIVE' ||
    normalized === 'DEACTIVATED' ||
    normalized === 'DEACTIVE' ||
    normalized === 'BLOCKED' ||
    normalized === 'DISABLED' ||
    normalized === 'FALSE' ||
    normalized === '0'
  ) {
    return 'INACTIVE';
  }
  if (
    normalized === 'ACTIVE' ||
    normalized === 'LIVE' ||
    normalized === 'ENABLED' ||
    normalized === 'TRUE' ||
    normalized === '1'
  ) {
    return 'ACTIVE';
  }
  if (
    normalized === 'ALL' ||
    normalized === 'BOTH' ||
    normalized === 'ANY' ||
    normalized === '*' ||
    normalized === 'ACTIVE_DEACTIVATED' ||
    normalized === 'ACTIVE_DEACTIVE' ||
    normalized === 'ACTIVE_INACTIVE' ||
    normalized === 'ACTIVE_AND_DEACTIVATED' ||
    normalized === 'ACTIVE_AND_DEACTIVE' ||
    normalized === 'ACTIVE_AND_INACTIVE' ||
    normalized === 'DEACTIVATED_ACTIVE' ||
    normalized === 'INACTIVE_ACTIVE' ||
    ((normalized.includes('DEACTIV') || normalized.includes('INACTIV')) &&
      (normalized.includes('_ACTIVE') || normalized.includes('ACTIVE_') || normalized.includes('AND')))
  ) {
    return 'ALL';
  }
  return str;
}, z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional());
export type BrandStatusFilter = z.infer<typeof BrandStatusFilterSchema>;

export const BrandListQuerySchema = z
  .object({
    page: page,
    limit: limit,
    pageSize: limit,
    search: safeText(100, 0).optional(),
    q: safeText(100, 0).optional(),
    isActive: boolQuery.optional(),
    status: BrandStatusFilterSchema.optional(),
    accountStatus: BrandStatusFilterSchema.optional(),
  })
  .transform((data) => {
    const resolvedStatus = data.status ?? data.accountStatus;
    const resolvedIsActive =
      resolvedStatus === 'ALL'
        ? undefined
        : resolvedStatus === 'ACTIVE'
          ? true
          : resolvedStatus === 'INACTIVE'
            ? false
            : data.isActive;

    return {
      page: data.page,
      limit: data.limit || data.pageSize,
      search: data.search || data.q,
      status: resolvedStatus,
      isActive: resolvedIsActive,
    };
  });
export type BrandListQuery = z.input<typeof BrandListQuerySchema>;
