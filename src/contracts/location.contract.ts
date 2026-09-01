import { z } from 'zod';
import { safeText, boolQuery, page, limit } from './primitives';
import {
  DEFAULT_COUNTRY,
  COUNTRIES,
  isKnownCountry,
  isKnownSubdivision,
  isSubdivisionOf,
  subdivisionsOf,
} from './geography';

export const LocationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  tier: z.number().int().nullable(),
  /** Soft delete. `false` means the row is gone, not merely retired. */
  isActive: z.boolean(),
  /** Retired from the dropdowns while staying readable on existing rows. */
  isArchived: z.boolean(),
  createdOn: z.string().or(z.date()),
  updatedOn: z.string().or(z.date()),
});

export type LocationResponse = z.infer<typeof LocationResponseSchema>;

/**
 * State and country are constrained to `geography`, not free text.
 *
 * These two columns are filtered on, and free text made that unreliable —
 * "Kerala", "KERALA" and "kerala" are one place to a person and three values to
 * a filter. The client offers only the listed pairs; this is the half that holds
 * when the request does not come from the client.
 */
export const CreateLocationSchema = z
  .object({
    name: safeText(100),
    state: safeText(100).optional(),
    country: safeText(100).optional(),
    tier: z.number().int().min(1).max(5).optional(),
  })
  .superRefine((data, ctx) => {
    const country = data.country?.trim() || DEFAULT_COUNTRY;

    if (!isKnownCountry(country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['country'],
        message: `Unsupported country "${country}". Choose one of: ${COUNTRIES.join(', ')}.`,
      });
      return;
    }

    const state = data.state?.trim();
    if (state && !isSubdivisionOf(country, state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['state'],
        message: `"${state}" is not a state or region of ${country}. Expected one of: ${subdivisionsOf(country).join(', ')}.`,
      });
    }
  });

export type CreateLocationRequest = z.infer<typeof CreateLocationSchema>;

/**
 * State and country travel together on a patch.
 *
 * A state alone could be moved under a country it does not belong to, and a
 * country alone could orphan the state already stored — each request looking
 * valid on its own. Requiring the pair lets it be checked here, rather than
 * pushing geography into the application layer, which cannot see contracts.
 */
export const UpdateLocationSchema = z
  .object({
    name: safeText(100).optional(),
    state: safeText(100)
      .refine((v) => isKnownSubdivision(v.trim()), {
        message: 'Unknown state or region. Choose one from the location list.',
      })
      .optional(),
    country: safeText(100)
      .refine((v) => isKnownCountry(v.trim()), {
        message: `Unsupported country. Choose one of: ${COUNTRIES.join(', ')}.`,
      })
      .optional(),
    tier: z.number().int().min(1).max(5).optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasState = data.state !== undefined;
    const hasCountry = data.country !== undefined;

    if (!hasState && !hasCountry) return;

    if (hasState && !hasCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['country'],
        message: 'Send the country alongside the state so the pair can be checked.',
      });
      return;
    }

    if (hasCountry && !hasState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['state'],
        message: 'Send the state alongside the country so the pair can be checked.',
      });
      return;
    }

    const country = data.country!.trim();
    const state = data.state!.trim();
    if (state && !isSubdivisionOf(country, state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['state'],
        message: `"${state}" is not a state or region of ${country}. Expected one of: ${subdivisionsOf(country).join(', ')}.`,
      });
    }
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
    isArchived: boolQuery.optional(),
    /**
     * ACTIVE / ARCHIVED select on the archive flag, not on the soft delete —
     * a deleted location is not something the screen offers to look at.
     */
    status: z
      .union([
        z.enum(['ACTIVE', 'ARCHIVED', 'ALL']),
        z.enum(['active', 'archived', 'all']).transform((v) => v.toUpperCase() as 'ACTIVE' | 'ARCHIVED' | 'ALL'),
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
    isArchived:
      data.status === 'ALL'
        ? undefined
        : data.status === 'ACTIVE'
          ? false
          : data.status === 'ARCHIVED'
            ? true
            : data.isArchived,
  }));

/**
 * The request shape, not the parsed one — a caller supplies `status` or `q` and
 * the transform derives `isArchived` and `search` from them. Mirrors
 * `CategoryListQuery`.
 */
export type LocationListQuery = z.input<typeof LocationListQuerySchema>;

