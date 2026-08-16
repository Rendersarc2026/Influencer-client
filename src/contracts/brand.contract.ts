import { z } from 'zod';
import { email, httpUrl, phone, safeText } from './primitives';

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
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type BrandResponse = z.infer<typeof BrandResponseSchema>;

/**
 * The owning agency is never part of the payload: it is taken from the acting
 * user's token, so a caller cannot create a brand under someone else's agency.
 */
export const CreateBrandSchema = z.object({
  name: safeText(200),
  industry: safeText(120).optional(),
  contactPerson: safeText(200).optional(),
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
});
export type CreateBrandRequest = z.infer<typeof CreateBrandSchema>;

/** Ownership is fixed at creation, so it is absent here too. */
export const UpdateBrandSchema = z.object({
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
  isActive: z.coerce.boolean().optional(),
});
export type BrandListQuery = z.infer<typeof BrandListQuerySchema>;
