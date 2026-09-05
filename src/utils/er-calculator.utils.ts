import { parseShorthandNumber } from './shorthand-number';

/**
 * Calculates median of an array of numbers.
 * For even length arrays, returns the average of the two middle elements.
 */
export function calculateMedian(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Calculates Engagement Rate percentage:
 * ER% = [(Total Likes + Total Comments) ÷ Number of Posts] ÷ Followers × 100
 */
export function calculateEngagementRate(
  totalLikes: number,
  totalComments: number,
  postsCount: number,
  followers: number,
): number {
  if (followers <= 0 || postsCount <= 0) return 0;
  const avgEngagement = (totalLikes + totalComments) / postsCount;
  const er = (avgEngagement / followers) * 100;
  return Math.max(0, parseFloat(er.toFixed(4)));
}

/**
 * Calculates Pre-Evaluation Cost Per View (CPV):
 * Pre Eval CPV = Reel Commercial Fee ÷ Pre Eval Committed Views
 */
export function calculatePreEvalCpv(commercialFee: number, committedViews: number): number | null {
  if (commercialFee <= 0 || committedViews <= 0) return null;
  const cpv = commercialFee / committedViews;
  return parseFloat(cpv.toFixed(2));
}

/**
 * Result of validating a single numeric input token.
 */
export interface NumericValidationResult {
  raw: string;
  isValid: boolean;
  value: number | null;
  error?: string;
}

/**
 * Validates whether a single string or number is a valid positive number or shorthand representation.
 * Supports: "1200", "45000", "1.2k", "1.5M", "50,000", "0".
 * Returns isValid: false for unparseable strings like "232jjjj.dfsdf", "sfs", "-50", "abc".
 */
export function validateNumericInput(
  input: string | number | null | undefined,
): NumericValidationResult {
  if (input === null || input === undefined || input === '') {
    return { raw: '', isValid: true, value: null };
  }

  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input) || input < 0) {
      return {
        raw: String(input),
        isValid: false,
        value: null,
        error: 'Must be a positive number',
      };
    }
    return { raw: String(input), isValid: true, value: Math.round(input) };
  }

  const trimmed = input.trim();
  if (trimmed === '') {
    return { raw: '', isValid: true, value: null };
  }

  // Reject negative numbers
  if (trimmed.startsWith('-')) {
    return { raw: trimmed, isValid: false, value: null, error: 'Negative numbers are not allowed' };
  }

  // Check shorthand notation like 10k, 1.5M, 20B
  const shorthand = parseShorthandNumber(trimmed);
  if (shorthand !== null) {
    return { raw: trimmed, isValid: true, value: shorthand };
  }

  // Check standard formatted number with commas: e.g. "50,000" or "1,200,000" or plain "50000"
  const withoutCommas = trimmed.replace(/,/g, '');
  const pureNumRegex = /^\+?(\d+(?:\.\d+)?)$/;
  const match = withoutCommas.match(pureNumRegex);
  if (!match) {
    return {
      raw: trimmed,
      isValid: false,
      value: null,
      error: `Invalid number format: "${trimmed}"`,
    };
  }

  const parsed = parseFloat(match[1]);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0 || parsed > 2_147_483_647) {
    return {
      raw: trimmed,
      isValid: false,
      value: null,
      error: `Number out of range: "${trimmed}"`,
    };
  }

  return { raw: trimmed, isValid: true, value: Math.round(parsed) };
}

/**
 * Parses numeric string supporting commas, decimals, and shorthand (e.g. 10k, 1.5M, 50,000).
 * Returns 0 if invalid or empty.
 */
export function parseNumberInput(input: string | number | null | undefined): number {
  const result = validateNumericInput(input);
  return result.isValid && result.value !== null ? result.value : 0;
}

/**
 * Cleans an Instagram URL or handle into a bare username without @, URLs, slashes or parameters.
 */
export function cleanInstagramHandle(urlOrHandle: string): string {
  if (!urlOrHandle) return '';
  let clean = urlOrHandle.trim();
  if (
    clean.includes('instagram.com') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://')
  ) {
    try {
      const url = clean.startsWith('http') ? clean : `https://${clean}`;
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const reserved = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts']);
      if (segments.length > 0) {
        if (reserved.has(segments[0].toLowerCase()) && segments.length > 1) {
          clean = segments[1];
        } else {
          clean = segments[0];
        }
      }
    } catch {
      clean = clean.replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '').replace(/[/?#].*$/, '');
    }
  }
  clean = clean
    .replace(/^@+/, '')
    .replace(/[/?#].*$/, '')
    .trim();
  return clean;
}

/**
 * Formats a handle or URL nicely for display (e.g. '@username').
 */
export function formatInstagramHandle(urlOrHandle: string, fallback = 'Influencer'): string {
  const clean = cleanInstagramHandle(urlOrHandle);
  if (!clean) return fallback;
  return `@${clean}`;
}
