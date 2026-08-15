import { z } from 'zod';
import { safeText } from './primitives';

/**
 * A coded value from the enum_code registry.
 *
 * `code` is a small integer numbered from 1 within its own category, so it is
 * only meaningful alongside `category` — CAMPAIGN_STATUS 1 and ROLE 1 are
 * different things.
 */
export const EnumCodeResponseSchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
  value: z.string(),
  code: z.number().int(),
});
export type EnumCodeResponse = z.infer<typeof EnumCodeResponseSchema>;

export const EnumCodeListQuerySchema = z.object({
  category: safeText(60).optional(),
});
export type EnumCodeListQuery = z.infer<typeof EnumCodeListQuerySchema>;
