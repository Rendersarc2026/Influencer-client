import { z } from 'zod';

/**
 * Shared request primitives.
 *
 * Every string that reaches the database passes through one of these.
 * They exist because `z.string()` and `z.string().url()` are both too
 * permissive for stored, cross-role rendered content:
 *
 *  - `z.string().url()` accepts `javascript:alert(1)` and `data:text/html,...`
 *    (it only asks whether `new URL()` parses). Those values are later bound to
 *    `href` / `src` in the web client and become stored XSS.
 *  - an unbounded `z.string()` lets one request write megabytes into a text
 *    column, and lets NUL / control bytes through into logs and exports.
 */

// Control characters have no legitimate place in user-supplied single-line
// text. NUL in particular is rejected outright by Postgres text columns.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/;

// Same, but tab / newline / carriage return are legitimate in multi-line text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

const HTTP_SCHEMES = ['http:', 'https:'];

/**
 * A single-line, trimmed, length-capped string with no control characters.
 * Angle brackets are NOT stripped: the client escapes on render (React) and
 * stripping would silently corrupt legitimate values like "Rate < 50k".
 * Escaping is the renderer's job; rejecting control bytes is ours.
 */
export function safeText(max: number, min = 1) {
  return z
    .string()
    .max(max, `Must be at most ${max} characters`)
    .refine((v) => !CONTROL_CHARS.test(v), 'Must not contain control characters')
    .transform((v) => v.trim())
    .refine((v) => v.length >= min, `Must be at least ${min} character${min === 1 ? '' : 's'}`);
}

/** Multi-line free text (notes, comments, bios). Newlines and tabs allowed. */
export function safeMultilineText(max: number, min = 1) {
  return z
    .string()
    .max(max, `Must be at most ${max} characters`)
    .refine((v) => !CONTROL_CHARS_EXCEPT_WHITESPACE.test(v), 'Must not contain control characters')
    .transform((v) => v.trim())
    .refine((v) => v.length >= min, `Must be at least ${min} character${min === 1 ? '' : 's'}`);
}

/**
 * An absolute http(s) URL. Rejects every other scheme, which is what stops a
 * stored `javascript:` or `data:` payload from ever reaching an `href`.
 */
export const httpUrl = z
  .string()
  .max(2048, 'URL must be at most 2048 characters')
  .refine((value) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }
    return HTTP_SCHEMES.includes(parsed.protocol) && parsed.hostname.length > 0;
  }, 'Must be an absolute http(s) URL');

/** Money amounts: finite, non-negative, at most 2 decimal places, sane ceiling. */
export const money = z
  .number()
  .finite('Must be a finite number')
  .nonnegative('Must not be negative')
  .max(9_999_999_999, 'Amount exceeds the maximum supported value')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places');

/** Non-negative integer counters (reach, impressions, engagements, followers). */
export const count = z
  .number()
  .int('Must be a whole number')
  .nonnegative('Must not be negative')
  .max(2_147_483_647, 'Value exceeds the maximum supported value');

/** Email, normalised to lowercase so lookups and uniqueness agree. */
export const email = z
  .string()
  .max(254, 'Email must be at most 254 characters')
  .email('Must be a valid email address')
  .transform((v) => v.trim().toLowerCase());

/** URL-safe slug: lowercase letters, digits and single hyphens. */
export function slug(max = 80) {
  return z
    .string()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => v.trim().toLowerCase())
    .refine(
      (v) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
      'Must contain only lowercase letters, digits and single hyphens',
    );
}

/** E.164-ish phone number. Separators are stripped before validation. */
export const phone = z
  .string()
  .max(32)
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^\+?[0-9]{7,15}$/.test(v), 'Must be a valid phone number');

/**
 * Boolean carried in a query string. `z.coerce.boolean()` cannot be used here:
 * it runs `Boolean(value)`, so the string "false" coerces to `true` and a
 * negative filter silently reads as a positive one.
 */
export const boolQuery = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

/** Cursor / pagination primitives. */
export const cursor = z.string().uuid().optional();
export const page = z.coerce.number().int().min(1).optional();
export const limit = z.coerce.number().int().min(1).max(100).optional();
export const search = safeText(100, 0).optional();

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v ? v.trim() : undefined)),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
