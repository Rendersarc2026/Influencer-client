import { z } from 'zod';
import { email, httpUrl, phone, safeText, slug } from './primitives';

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

export const CreateAgencySchema = z.object({
  name: safeText(200),
  slug: slug(),
  contactPerson: safeText(200).optional(),
  contactPhone: phone.optional(),
  contactEmail: email,
  gstNumber: safeText(30).optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  website: httpUrl.optional(),
});
export type CreateAgencyRequest = z.infer<typeof CreateAgencySchema>;

export const UpdateAgencySchema = z.object({
  name: safeText(200).optional(),
  slug: slug().optional(),
  contactPerson: safeText(200).optional(),
  contactPhone: phone.optional(),
  contactEmail: email.optional(),
  gstNumber: safeText(30).optional(),
  address: safeText(400).optional(),
  city: safeText(120).optional(),
  website: httpUrl.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAgencyRequest = z.infer<typeof UpdateAgencySchema>;

export const AgencyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type AgencyListQuery = z.infer<typeof AgencyListQuerySchema>;
