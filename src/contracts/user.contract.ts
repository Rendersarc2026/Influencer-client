import { z } from 'zod';
import {
  boolQuery,
  count,
  email,
  httpUrl,
  limit,
  money,
  moneyQuery,
  multiStringQuery,
  page,
  phone,
  safeMultilineText,
  safeText,
} from './primitives';

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
  email: z.string().nullable().optional(),
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

/**
 * A creator row the agency enters before that creator ever signs in themselves
 * (see InfluencerRepository.create).
 */
export const CreateInfluencerSchema = z
  .object({
    name: safeText(200),
    /**
     * Both are mandatory: the pair becomes the creator's login when the agency
     * enters them, ahead of their first sign-in.
     */
    email: email,
    category: safeText(120).optional(),
    location: safeText(120).optional(),
    followers: count.optional(),
    contactPhone: phone,
    instagram: httpUrl.optional(),
    youtube: httpUrl.optional(),
    avgCommercialMin: money.optional(),
    avgCommercialMax: money.optional(),
    currency: safeText(10).optional(),
  })
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
export type CreateInfluencerRequest = z.infer<typeof CreateInfluencerSchema>;

export const UpdateInfluencerSchema = z
  .object({
    category: safeText(120).optional(),
    location: safeText(120).optional(),
    followers: count.optional(),
    contactPhone: phone.optional(),
    instagram: httpUrl.optional(),
    youtube: httpUrl.optional(),
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
  /** Tenant names, joined in on read so a list need not resolve ids itself. */
  agencyName: z.string().nullable(),
  brandName: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
  profile: ProfileResponseSchema.nullable().optional(),
  influencer: InfluencerResponseSchema.nullable().optional(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * The one write an admin has over an account.
 *
 * Logins are provisioned alongside the row they belong to — a brand's manager
 * when the agency creates the brand, a creator's when the agency enters them —
 * so there is no admin-side account creation, and nothing an admin may edit
 * beyond blocking or unblocking. Role and tenancy in particular are fixed:
 * changing either would move a live account across a tenant boundary.
 */
export const SetUserBlockedSchema = z.object({
  blocked: z.boolean(),
});
export type SetUserBlockedRequest = z.infer<typeof SetUserBlockedSchema>;

/**
 * Which side of the active/deactivated split a list should return. Distinct
 * from `isActive` because it can also express "both", which an optional
 * boolean cannot — an absent `isActive` already means "active only".
 */
export const UserStatusFilterSchema = z.union([
  z.enum(['ACTIVE', 'INACTIVE', 'ALL']),
  z.enum(['active', 'inactive', 'all']).transform((v) => v.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'ALL'),
]);
export type UserStatusFilter = z.infer<typeof UserStatusFilterSchema>;

export const InfluencerListQuerySchema = z
  .object({
    page: page,
    limit: limit,
    pageSize: limit,
    search: safeText(100, 0).optional(),
    q: safeText(100, 0).optional(),
    category: multiStringQuery(120),
    categories: multiStringQuery(120),
    location: multiStringQuery(120),
    city: multiStringQuery(120),
    locations: multiStringQuery(120),
    cities: multiStringQuery(120),
    agencyId: z.string().uuid().optional(),
    isActive: boolQuery.optional(),
    status: UserStatusFilterSchema.optional(),
    minPrice: moneyQuery,
    maxPrice: moneyQuery,
    minCommercial: moneyQuery,
    maxCommercial: moneyQuery,
    avgCommercialMin: moneyQuery,
    avgCommercialMax: moneyQuery,
    minAvgPrice: moneyQuery,
    maxAvgPrice: moneyQuery,
    priceMin: moneyQuery,
    priceMax: moneyQuery,
    avgPrice: moneyQuery,
    price: moneyQuery,
  })
  .transform((data) => {
    const minPrice =
      data.minPrice ??
      data.minCommercial ??
      data.avgCommercialMin ??
      data.minAvgPrice ??
      data.priceMin ??
      data.avgPrice ??
      data.price;
    const maxPrice =
      data.maxPrice ??
      data.maxCommercial ??
      data.avgCommercialMax ??
      data.maxAvgPrice ??
      data.priceMax ??
      data.avgPrice ??
      data.price;

    const locations = [
      ...(data.locations ?? []),
      ...(data.location ?? []),
      ...(data.cities ?? []),
      ...(data.city ?? []),
    ];
    const uniqueLocations = locations.length > 0 ? [...new Set(locations)] : undefined;

    const categories = [
      ...(data.categories ?? []),
      ...(data.category ?? []),
    ];
    const uniqueCategories = categories.length > 0 ? [...new Set(categories)] : undefined;

    const primaryLocation =
      (data.location && data.location.length > 0 ? data.location[0] : undefined) ||
      (data.city && data.city.length > 0 ? data.city[0] : undefined) ||
      (uniqueLocations && uniqueLocations.length === 1 ? uniqueLocations[0] : undefined);

    const primaryCategory =
      (data.category && data.category.length > 0 ? data.category[0] : undefined) ||
      (data.categories && data.categories.length > 0 ? data.categories[0] : undefined) ||
      (uniqueCategories && uniqueCategories.length === 1 ? uniqueCategories[0] : undefined);

    return {
      page: data.page,
      limit: data.limit || data.pageSize,
      search: data.search || data.q,
      location: primaryLocation,
      city: primaryLocation,
      locations: uniqueLocations,
      cities: uniqueLocations,
      category: primaryCategory,
      categories: uniqueCategories,
      agencyId: data.agencyId,
      minPrice,
      maxPrice,
      isActive:
        data.status === 'ALL'
          ? undefined
          : data.status === 'ACTIVE'
            ? true
            : data.status === 'INACTIVE'
              ? false
              : data.isActive,
    };
  });
export type InfluencerListQuery = z.input<typeof InfluencerListQuerySchema>;

export const UserListQuerySchema = z
  .object({
    page: page,
    limit: limit,
    pageSize: limit,
    search: safeText(100, 0).optional(),
    q: safeText(100, 0).optional(),
    agencyId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    roleCode: multiStringQuery(50),
    role: multiStringQuery(50),
    roleCodes: multiStringQuery(50),
    roles: multiStringQuery(50),
    excludeRoleCodes: multiStringQuery(50),
    excludeRoles: multiStringQuery(50),
    city: multiStringQuery(120),
    location: multiStringQuery(120),
    cities: multiStringQuery(120),
    locations: multiStringQuery(120),
    category: multiStringQuery(120),
    categories: multiStringQuery(120),
    isActive: boolQuery.optional(),
    status: UserStatusFilterSchema.optional(),
    minPrice: moneyQuery,
    maxPrice: moneyQuery,
    minCommercial: moneyQuery,
    maxCommercial: moneyQuery,
    avgCommercialMin: moneyQuery,
    avgCommercialMax: moneyQuery,
    minAvgPrice: moneyQuery,
    maxAvgPrice: moneyQuery,
    priceMin: moneyQuery,
    priceMax: moneyQuery,
    avgPrice: moneyQuery,
    price: moneyQuery,
  })
  .transform((data) => {
    const minPrice =
      data.minPrice ??
      data.minCommercial ??
      data.avgCommercialMin ??
      data.minAvgPrice ??
      data.priceMin ??
      data.avgPrice ??
      data.price;
    const maxPrice =
      data.maxPrice ??
      data.maxCommercial ??
      data.avgCommercialMax ??
      data.maxAvgPrice ??
      data.priceMax ??
      data.avgPrice ??
      data.price;

    const locations = [
      ...(data.locations ?? []),
      ...(data.location ?? []),
      ...(data.cities ?? []),
      ...(data.city ?? []),
    ];
    const uniqueLocations = locations.length > 0 ? [...new Set(locations)] : undefined;

    const categories = [
      ...(data.categories ?? []),
      ...(data.category ?? []),
    ];
    const uniqueCategories = categories.length > 0 ? [...new Set(categories)] : undefined;

    const roleCodes = [
      ...(data.roleCodes ?? []),
      ...(data.roleCode ?? []),
      ...(data.roles ?? []),
      ...(data.role ?? []),
    ].map((s) => s.toUpperCase());
    const uniqueRoleCodes = roleCodes.length > 0 ? [...new Set(roleCodes)] : undefined;

    const excludeRoleCodes = [
      ...(data.excludeRoleCodes ?? []),
      ...(data.excludeRoles ?? []),
    ].map((s) => s.toUpperCase());
    const uniqueExcludeRoleCodes =
      excludeRoleCodes.length > 0 ? [...new Set(excludeRoleCodes)] : undefined;

    const primaryRoleCode =
      (data.roleCode && data.roleCode.length > 0 ? data.roleCode[0].toUpperCase() : undefined) ||
      (data.role && data.role.length > 0 ? data.role[0].toUpperCase() : undefined) ||
      (uniqueRoleCodes && uniqueRoleCodes.length === 1 ? uniqueRoleCodes[0] : undefined);

    const primaryCity =
      (data.city && data.city.length > 0 ? data.city[0] : undefined) ||
      (data.location && data.location.length > 0 ? data.location[0] : undefined) ||
      (uniqueLocations && uniqueLocations.length === 1 ? uniqueLocations[0] : undefined);

    const primaryCategory =
      (data.category && data.category.length > 0 ? data.category[0] : undefined) ||
      (data.categories && data.categories.length > 0 ? data.categories[0] : undefined) ||
      (uniqueCategories && uniqueCategories.length === 1 ? uniqueCategories[0] : undefined);

    return {
      page: data.page,
      limit: data.limit || data.pageSize,
      search: data.search || data.q,
      agencyId: data.agencyId,
      brandId: data.brandId,
      role: primaryRoleCode,
      roleCode: primaryRoleCode,
      roleCodes: uniqueRoleCodes,
      excludeRoleCodes: uniqueExcludeRoleCodes,
      excludeRoles: uniqueExcludeRoleCodes,
      city: primaryCity,
      location: primaryCity,
      locations: uniqueLocations,
      cities: uniqueLocations,
      category: primaryCategory,
      categories: uniqueCategories,
      minPrice,
      maxPrice,
      isActive:
        data.status === 'ALL'
          ? undefined
          : data.status === 'ACTIVE'
            ? true
            : data.status === 'INACTIVE'
              ? false
              : data.isActive,
    };
  });
export type UserListQuery = z.input<typeof UserListQuerySchema>;
