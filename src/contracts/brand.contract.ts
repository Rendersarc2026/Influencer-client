import { z } from 'zod';
import { email, httpUrl, phone, safeText } from './primitives';

export const BrandResponseSchema = z.object({
  id: z.string().uuid(),
  /**
   * Every agency managing this brand, resolved through agency_brand_mapper.
   * Many-to-many in both directions: an agency handles many brands, and a brand
   * may be handled by several agencies.
   */
  agencyIds: z.array(z.string().uuid()),
  name: z.string(),
  industry: z.string().nullable(),
  contactPerson: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  logoUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type BrandResponse = z.infer<typeof BrandResponseSchema>;

export const CreateBrandSchema = z.object({
  /** Convenience for the single-agency case. */
  agencyId: z.string().uuid().optional(),
  /** Full set of managing agencies; wins over agencyId when both are given. */
  agencyIds: z.array(z.string().uuid()).max(20).optional(),
  name: safeText(200),
  industry: safeText(120).optional(),
  contactPerson: safeText(200).optional(),
  contactPhone: phone.optional(),
  contactEmail: email.optional(),
  website: httpUrl.optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  logoUrl: httpUrl.optional(),
});
export type CreateBrandRequest = z.infer<typeof CreateBrandSchema>;

export const UpdateBrandSchema = z.object({
  agencyId: z.string().uuid().optional(),
  agencyIds: z.array(z.string().uuid()).max(20).optional(),
  name: safeText(200).optional(),
  industry: safeText(120).optional(),
  contactPerson: safeText(200).optional(),
  contactPhone: phone.optional(),
  contactEmail: email.optional(),
  website: httpUrl.optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  logoUrl: httpUrl.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBrandRequest = z.infer<typeof UpdateBrandSchema>;

export const BrandListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  agencyId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type BrandListQuery = z.infer<typeof BrandListQuerySchema>;
