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
