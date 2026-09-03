import { phone } from '@contracts';

/**
 * The calling codes the phone field offers, with the subscriber length each one
 * expects.
 *
 * These mirror `NATIONAL_DIGIT_LENGTHS` in the shared contract. The server is
 * the authority — this copy is what lets the field cap what can be typed and
 * reject a wrong-length number before it is ever sent. Adding a country means
 * adding it in both places.
 */
export interface CountryCallingCode {
  code: string;
  label: string;
  lengths: number[];
}

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { code: '91', label: 'India (+91)', lengths: [10] },
  { code: '1', label: 'US / Canada (+1)', lengths: [10] },
  { code: '44', label: 'United Kingdom (+44)', lengths: [10] },
  { code: '49', label: 'Germany (+49)', lengths: [10, 11] },
  { code: '61', label: 'Australia (+61)', lengths: [9] },
  { code: '65', label: 'Singapore (+65)', lengths: [8] },
  { code: '971', label: 'United Arab Emirates (+971)', lengths: [9] },
];

/** The home market, and what an empty field starts on. */
export const DEFAULT_CALLING_CODE = '91';

/**
 * The single client-side phone check, delegating to the shared contract so the
 * form and the API cannot disagree about what a valid number is.
 *
 * Four components each carried their own regex before this, all of them looser
 * than the server's — which is how a thirteen-digit "+91" number passed every
 * form it was typed into. An empty value returns no error: whether the field is
 * required is the form's decision, not this helper's.
 */
export function validatePhoneNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const result = phone.safeParse(trimmed);
  return result.success ? '' : result.error.errors[0].message;
}
