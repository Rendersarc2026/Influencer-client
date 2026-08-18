import { z } from 'zod';
import { safeText, boolQuery, page, limit } from './primitives';

export const LocationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  tier: z.number().int().nullable(),
  isActive: z.boolean(),
  createdOn: z.string().or(z.date()),
  updatedOn: z.string().or(z.date()),
});

export type LocationResponse = z.infer<typeof LocationResponseSchema>;

export const CreateLocationSchema = z.object({
  name: safeText(100),
  state: safeText(100).optional(),
  country: safeText(100).optional(),
  tier: z.number().int().min(1).max(5).optional(),
});

export type CreateLocationRequest = z.infer<typeof CreateLocationSchema>;

export const UpdateLocationSchema = z.object({
  name: safeText(100).optional(),
  state: safeText(100).optional(),
  country: safeText(100).optional(),
  tier: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLocationRequest = z.infer<typeof UpdateLocationSchema>;

export const LocationListQuerySchema = z
  .object({
    search: safeText(100, 0).optional(),
    q: safeText(100, 0).optional(),
    name: safeText(100, 0).optional(),
    state: safeText(100, 1).optional(),
    country: safeText(100, 1).optional(),
    tier: z.coerce.number().int().min(1).max(5).optional(),
    isActive: boolQuery.optional(),
    status: z
      .union([
        z.enum(['ACTIVE', 'INACTIVE', 'ALL']),
        z.enum(['active', 'inactive', 'all']).transform((v) => v.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'ALL'),
      ])
      .optional(),
    page: page,
    limit: limit,
    pageSize: limit,
  })
  .transform((data) => ({
    ...data,
    search: data.search || data.q || data.name,
    limit: data.limit || data.pageSize,
    isActive:
      data.status === 'ALL'
        ? undefined
        : data.status === 'ACTIVE'
          ? true
          : data.status === 'INACTIVE'
            ? false
            : data.isActive,
  }));

export type LocationListQuery = z.infer<typeof LocationListQuerySchema>;

