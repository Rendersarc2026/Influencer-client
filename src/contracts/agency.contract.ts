import { z } from 'zod';

/**
 * The agency is provisioned by the seed, not through the API: the platform runs
 * a single agency and no screen creates, lists or re-homes one. Only the
 * response shape survives, for the agency's own profile read.
 */
export const AgencyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  contactPerson: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  gstNumber: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  website: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type AgencyResponse = z.infer<typeof AgencyResponseSchema>;
