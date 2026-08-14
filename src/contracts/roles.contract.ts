import { z } from 'zod';

export const ROLES = {
  ADMIN: 'ADMIN',
  AGENCY: 'AGENCY',
  BRAND: 'BRAND',
  INFLUENCER: 'INFLUENCER',
} as const;

export const RoleCodeEnum = z.enum(['ADMIN', 'AGENCY', 'BRAND', 'INFLUENCER']);
export type RoleCode = z.infer<typeof RoleCodeEnum>;
export type RoleName = RoleCode;
