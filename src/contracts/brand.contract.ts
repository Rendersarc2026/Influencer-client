import { z } from 'zod';
import { safeText } from './primitives';

export const BrandResponseSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  name: z.string(),
  industry: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type BrandResponse = z.infer<typeof BrandResponseSchema>;

export const CreateBrandSchema = z.object({
  agencyId: z.string().uuid().optional(),
  name: safeText(200),
  industry: safeText(120).optional(),
});
export type CreateBrandRequest = z.infer<typeof CreateBrandSchema>;

export const UpdateBrandSchema = z.object({
  agencyId: z.string().uuid().optional(),
  name: safeText(200).optional(),
  industry: safeText(120).optional(),
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

