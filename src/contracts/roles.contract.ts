import { z } from 'zod';

/**
 * The three roles the platform has.
 *
 * There is no ADMIN. The agency owns everything operational — its brands, its
 * creators, their campaigns, the shared category taxonomy and the accounts of
 * the people it works with — so a fourth role sitting above it had nothing left
 * to do that the agency does not already do for itself.
 */
export const ROLES = {
  AGENCY: 'AGENCY',
  BRAND: 'BRAND',
  INFLUENCER: 'INFLUENCER',
} as const;

export const RoleCodeEnum = z.enum(['AGENCY', 'BRAND', 'INFLUENCER']);
export type RoleCode = z.infer<typeof RoleCodeEnum>;
export type RoleName = RoleCode;
