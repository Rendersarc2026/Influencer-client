import { z } from 'zod';
import { safeText, slug } from './primitives';

export const AgencyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type AgencyResponse = z.infer<typeof AgencyResponseSchema>;

export const CreateAgencySchema = z.object({
  name: safeText(200),
  slug: slug(),
});
export type CreateAgencyRequest = z.infer<typeof CreateAgencySchema>;

export const UpdateAgencySchema = z.object({
  name: safeText(200).optional(),
  slug: slug().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAgencyRequest = z.infer<typeof UpdateAgencySchema>;
