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

/**
 * A human name: the contact person on a brand, a creator's own name, the name
 * on a profile.
 *
 * Rejects values containing numbers or invalid symbols. Requires letters across
 * scripts, allowing spaces and standard name punctuation (hyphens, apostrophes, periods).
 */
export function personName(max: number, min = 1) {
  return safeText(max, min)
    .refine((v) => !/[\d\p{N}]/u.test(v), 'Numbers are not allowed')
    .refine((v) => /^[\p{L}\p{M}\s'’‘.-]+$/u.test(v), 'Must contain only letters')
    .refine((v) => /\p{L}/u.test(v), 'Must contain at least one letter');
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

/**
 * One or more absolute http(s) URLs separated by newlines, commas, or whitespace.
 */
export const httpUrls = z
  .string()
  .max(4096, 'URLs must be at most 4096 characters')
  .refine((value) => {
    const urls = value
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return true;
    return urls.every((u) => {
      try {
        const parsed = new URL(u);
        return HTTP_SCHEMES.includes(parsed.protocol) && parsed.hostname.length > 0;
      } catch {
        return false;
      }
    });
  }, 'Each entry must be a valid http(s) URL');

/** Money amounts: finite, non-negative, at most 2 decimal places, sane ceiling. */
export const money = z
  .number()
  .finite('Must be a finite number')
  .nonnegative('Must not be negative')
  .max(9_999_999_999, 'Amount exceeds the maximum supported value')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places');

/** Money query parameter: coerced from string, finite, non-negative, at most 2 decimal places. */
export const moneyQuery = z.coerce
  .number()
  .finite('Must be a finite number')
  .nonnegative('Must not be negative')
  .max(9_999_999_999, 'Amount exceeds the maximum supported value')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places')
  .optional();

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
      'Must contain only lowercase letters, digits, and single hyphens without spaces',
    );
}

/**
 * How many digits the subscriber number has, per country calling code.
 *
 * The old rule was `7..15 digits total`, which is only E.164's global envelope:
 * it happily accepted "+91938739353600" — a country code plus thirteen digits
 * where an Indian number has ten. Checking the national length against the code
 * the number actually carries is what makes the field mean something.
 *
 * Only the codes this platform actually sees are listed. Anything else falls
 * back to the global envelope rather than being rejected, so an unlisted country
 * is still usable — add its lengths here to tighten it.
 */
const NATIONAL_DIGIT_LENGTHS: Record<string, readonly number[]> = {
  '1': [10], // US / Canada
  '44': [10], // United Kingdom
  '49': [10, 11], // Germany
  '61': [9], // Australia
  '65': [8], // Singapore
  '91': [10], // India
  '971': [9], // United Arab Emirates
};

/** Longest first: calling codes are 1-3 digits and "971" must beat "97" and "9". */
const CALLING_CODES = Object.keys(NATIONAL_DIGIT_LENGTHS).sort((a, b) => b.length - a.length);

/** Everything that is punctuation in a written phone number and noise in a stored one. */
const PHONE_SEPARATORS = /[\s()./-]/g;

/**
 * Splits a stored E.164 number into the parts a form edits separately.
 *
 * Returns `null` for anything that is not E.164, which is what lets a caller
 * fall back to showing the raw stored value instead of silently mangling it.
 */
export function splitPhone(value: string): { countryCode: string; nationalNumber: string } | null {
  const compact = value.replace(PHONE_SEPARATORS, '');
  if (!/^\+[0-9]{8,15}$/.test(compact)) return null;

  const digits = compact.slice(1);
  for (const code of CALLING_CODES) {
    if (digits.startsWith(code)) {
      return { countryCode: code, nationalNumber: digits.slice(code.length) };
    }
  }
  // Unknown code: assume the shortest plausible one so the number stays editable.
  return { countryCode: digits.slice(0, 2), nationalNumber: digits.slice(2) };
}

/**
 * A phone number in E.164 form: a leading `+`, a country calling code, then the
 * subscriber number.
 *
 * The `+` is required. Without it a number is ambiguous — "9876543210" could be
 * a ten-digit Indian number or a national number in any other plan — and the
 * per-country length check below has nothing to key on.
 */
export const phone = z
  .string()
  .max(32)
  .transform((v) => v.replace(PHONE_SEPARATORS, ''))
  .refine(
    (v) => /^\+[0-9]{8,15}$/.test(v),
    'Must be a phone number in international format, e.g. +91 9876543210',
  )
  .refine((v) => {
    const parts = splitPhone(v);
    if (!parts) return false;
    const expected = NATIONAL_DIGIT_LENGTHS[parts.countryCode];
    // Unlisted country code: the E.164 envelope above is all we can assert.
    return !expected || expected.includes(parts.nationalNumber.length);
  }, 'Phone number has the wrong number of digits for its country code');

/** Password primitive: length-bounded (min 6, max 128), no whitespace, no control characters. */
export const password = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((v) => !/\s/.test(v), 'Password cannot contain spaces or whitespace')
  .refine((v) => !CONTROL_CHARS.test(v), 'Password must not contain control characters');

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

/**
 * Multi-string query parameter: parses a single string, comma-separated string,
 * or array of strings into a normalized array of clean strings.
 */
export function multiStringQuery(maxItem = 120, maxTotal = 2000) {
  return z
    .union([
      z
        .string()
        .max(maxTotal)
        .refine((v) => !CONTROL_CHARS.test(v), 'Must not contain control characters'),
      z.array(
        z
          .string()
          .max(maxItem)
          .refine((v) => !CONTROL_CHARS.test(v), 'Must not contain control characters'),
      ),
    ])
    .transform((val) => {
      if (typeof val === 'string') {
        return val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return val.map((s) => s.trim()).filter(Boolean);
    })
    .optional();
}

/**
 * Array of validated strings (e.g. influencing regions).
 * Accepts array of strings or comma-separated string, bounds items to safe strings.
 */
export const regionsArray = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    if (Array.isArray(val))
      return val.map((s) => (typeof s === 'string' ? s.trim() : s)).filter(Boolean);
    if (typeof val === 'string') {
      return val
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return val;
  },
  z.array(safeText(120)).max(50).optional(),
);
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
