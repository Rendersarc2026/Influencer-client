import { z } from 'zod';
import { count, email, httpUrl, phone, safeMultilineText, safeText } from './primitives';
import { RoleCodeEnum } from './roles.contract';

export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  city: z.string().nullable(),
  instagram: z.string().nullable(),
  youtube: z.string().nullable(),
  followers: z.number().nullable(),
  completedOn: z.date().nullable(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileSchema = z.object({
  fullName: safeText(120).optional(),
  displayName: safeText(120).optional(),
  avatarUrl: httpUrl.optional(),
  bio: safeMultilineText(2000).optional(),
  city: safeText(120).optional(),
  instagram: safeText(120).optional(),
  youtube: safeText(120).optional(),
  followers: count.optional(),
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

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  agencyId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  roleCode: z.string().optional(),
  city: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type UserListQuery = z.infer<typeof UserListQuerySchema>;

