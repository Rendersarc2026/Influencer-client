import { z } from 'zod';
import {
  boolQuery,
  count,
  email,
  httpUrl,
  money,
  phone,
  safeMultilineText,
  safeText,
} from './primitives';
import { RoleCodeEnum } from './roles.contract';

/** Identity fields every role has. Creator-only data lives on InfluencerDetail. */
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  completedOn: z.date().nullable(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const InfluencerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable(),
  location: z.string().nullable(),
  followers: z.number().nullable(),
  contactPhone: z.string().nullable(),
  instagram: z.string().nullable(),
  youtube: z.string().nullable(),
  avgCommercialMin: z.number().nullable(),
  avgCommercialMax: z.number().nullable(),
  currency: z.string(),
});
export type InfluencerResponse = z.infer<typeof InfluencerResponseSchema>;

export const UpdateInfluencerSchema = z
  .object({
    category: safeText(120).optional(),
    location: safeText(120).optional(),
    followers: count.optional(),
    contactPhone: phone.optional(),
    instagram: safeText(120).optional(),
    youtube: safeText(120).optional(),
    avgCommercialMin: money.optional(),
    avgCommercialMax: money.optional(),
  })
  // A range whose ceiling sits below its floor is not a range. The same rule is
  // enforced by a CHECK constraint, so a bad pair cannot reach the table even if
  // it bypasses this schema.
  .refine(
    (d) =>
      d.avgCommercialMin === undefined ||
      d.avgCommercialMax === undefined ||
      d.avgCommercialMax >= d.avgCommercialMin,
    {
      message: 'avgCommercialMax must be greater than or equal to avgCommercialMin',
      path: ['avgCommercialMax'],
    },
  );
export type UpdateInfluencerRequest = z.infer<typeof UpdateInfluencerSchema>;

/**
 * One payload for both tables. Splitting this into two endpoints would cost two
 * network round trips to the database for what a user experiences as a single
 * "save profile" action, so the creator fields ride along in a nested object and
 * the use case writes both rows in one transaction.
 *
 * `influencer` is ignored for non-INFLUENCER callers — no other role has a
 * creator row.
 */
export const UpdateProfileSchema = z.object({
  fullName: safeText(120).optional(),
  displayName: safeText(120).optional(),
  avatarUrl: httpUrl.optional(),
  bio: safeMultilineText(2000).optional(),
  influencer: UpdateInfluencerSchema.optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid(),
  roleCode: z.string(),
  phone: z.string().nullable(),
  agencyId: z.string().uuid().nullable(),
  brandId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
  profile: ProfileResponseSchema.nullable().optional(),
  influencer: InfluencerResponseSchema.nullable().optional(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const CreateUserSchema = z
  .object({
    email,
    roleCode: RoleCodeEnum,
    phone: phone.optional(),
    agencyId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
  })
  // A tenant-scoped role without its tenant id produces a token that no
  // repository can scope. Reject it at the edge rather than issue one.
  .refine((d) => d.roleCode !== 'AGENCY' || Boolean(d.agencyId), {
    message: 'agencyId is required for an AGENCY user',
    path: ['agencyId'],
  })
  .refine((d) => d.roleCode !== 'BRAND' || Boolean(d.brandId), {
    message: 'brandId is required for a BRAND user',
    path: ['brandId'],
  });
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  phone: phone.optional(),
  agencyId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export const AssignUserSchema = z.object({
  agencyId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
});
export type AssignUserRequest = z.infer<typeof AssignUserSchema>;

export const InfluencerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  category: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  agencyId: z.string().uuid().optional(),
  isActive: boolQuery.optional(),
});
export type InfluencerListQuery = z.infer<typeof InfluencerListQuerySchema>;

/**
 * Which side of the active/deactivated split a list should return. Distinct
 * from `isActive` because it can also express "both", which an optional
 * boolean cannot — an absent `isActive` already means "active only".
 */
export const UserStatusFilterSchema = z.enum(['ACTIVE', 'INACTIVE', 'ALL']);
export type UserStatusFilter = z.infer<typeof UserStatusFilterSchema>;

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  agencyId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  roleCode: z.string().optional(),
  /** Matches influencer_detail.location. */
  city: z.string().max(100).optional(),
  isActive: boolQuery.optional(),
  status: UserStatusFilterSchema.optional(),
});
export type UserListQuery = z.infer<typeof UserListQuerySchema>;
