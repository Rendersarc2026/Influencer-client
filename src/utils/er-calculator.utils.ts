import { parseShorthandNumber } from './shorthand-number';

export interface ManualPostRowData {
  id: string;
  likes: string;
  comments: string;
  views: string;
}

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
 * Structured result of parsing bulk-pasted numeric data.
 */
export interface BulkParseValidationResult {
  raw: string;
  tokens: NumericValidationResult[];
  validTokens: NumericValidationResult[];
  invalidTokens: NumericValidationResult[];
  validValues: number[];
  invalidStrings: string[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  hasErrors: boolean;
}

/**
 * Parses and strictly validates bulk-pasted numbers.
 * Splits by newlines, commas, semicolons, tabs, and spaces.
 */
export function parseAndValidateBulkInput(input: string): BulkParseValidationResult {
  if (!input || !input.trim()) {
    return {
      raw: '',
      tokens: [],
      validTokens: [],
      invalidTokens: [],
      validValues: [],
      invalidStrings: [],
      totalCount: 0,
      validCount: 0,
      invalidCount: 0,
      hasErrors: false,
    };
  }

  // Split by commas, newlines, semicolons, tabs, spaces
  const rawParts = input.split(/[\n\r,;\t\s]+/).filter((p) => p.trim().length > 0);

  const tokens: NumericValidationResult[] = [];
  const validTokens: NumericValidationResult[] = [];
  const invalidTokens: NumericValidationResult[] = [];
  const validValues: number[] = [];
  const invalidStrings: string[] = [];

  for (const part of rawParts) {
    const res = validateNumericInput(part);
    tokens.push(res);
    if (res.isValid && res.value !== null && res.value >= 0) {
      validTokens.push(res);
      validValues.push(res.value);
    } else {
      invalidTokens.push(res);
      invalidStrings.push(part);
    }
  }

  return {
    raw: input,
    tokens,
    validTokens,
    invalidTokens,
    validValues,
    invalidStrings,
    totalCount: tokens.length,
    validCount: validTokens.length,
    invalidCount: invalidTokens.length,
    hasErrors: invalidTokens.length > 0,
  };
}

/**
 * Parses a bulk text containing numbers separated by commas, spaces, tabs, or newlines.
 * Returns only strictly valid positive integers.
 */
export function parseNumberList(input: string): number[] {
  const result = parseAndValidateBulkInput(input);
  return result.validValues;
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

/* ------------------------------------------------------------------ */
/* Trial-reel detection                                                */
/* ------------------------------------------------------------------ */

/**
 * Why a post looks like an Instagram "trial reel".
 *
 * Trial reels go out to non-followers only, so they never appear on the
 * creator's grid — but Meta's business_discovery edge returns them anyway, with
 * no flag separating them from real posts, and their cold-audience numbers drag
 * the engagement rate down.
 *
 * This mirrors detectLikelyTrialPosts in the server's instagram-metrics domain
 * service, which is the source of truth. It exists here as a fallback for
 * responses that carry no `trialReason` — a deployed API older than the field.
 * Keep the two in step: the constants and the two tests below are the contract.
 */
export type TrialFlagReason = 'NO_LIKES_DESPITE_REACH' | 'COLD_AUDIENCE_OUTLIER';

/** The fields detection needs, so any post-shaped object qualifies. */
export interface TrialCandidate {
  likes: number;
  comments: number;
  views: number | null;
  mediaKind: 'REEL' | 'VIDEO' | 'CAROUSEL' | 'IMAGE';
}

/** A post with real reach and zero likes is flagged outright at this many views. */
const TRIAL_ZERO_LIKE_REACH = 500;
/** Interactions at or under this share of the pool median count as cold. */
const TRIAL_INTERACTION_RATIO = 0.25;
/** Views at or under this share of the median video view count count as cold. */
const TRIAL_VIEWS_RATIO = 0.4;
/** Below this many posts the medians describe noise rather than a baseline. */
const TRIAL_MIN_POOL = 4;

function isVideoKind(kind: TrialCandidate['mediaKind']): boolean {
  return kind === 'REEL' || kind === 'VIDEO';
}

/**
 * Flag the posts in a pool that look like trial reels, as an array parallel to
 * the input (null where nothing is suspicious).
 *
 * The baseline is the creator's own pool rather than any absolute threshold —
 * 30k views is a flop for one account and a career post for another. Only
 * videos are considered: trials are a reels-only feature, and a carousel has no
 * view count to compare against in the first place.
 */
export function detectLikelyTrialPosts<T extends TrialCandidate>(
  posts: T[],
): (TrialFlagReason | null)[] {
  const flags: (TrialFlagReason | null)[] = posts.map(() => null);
  if (posts.length < TRIAL_MIN_POOL) return flags;

  // A creator who hides like counts reports 0 likes everywhere, which would
  // otherwise flag their entire feed. Require evidence that likes are readable.
  const likesReadable = posts.some((post) => post.likes > 0);

  const interactionMedian = calculateMedian(posts.map((post) => post.likes + post.comments));
  const viewsMedian = calculateMedian(
    posts
      .filter((post) => isVideoKind(post.mediaKind))
      .map((post) => post.views)
      .filter((value): value is number => value !== null && value > 0),
  );

  posts.forEach((post, index) => {
    if (!isVideoKind(post.mediaKind)) return;
    const views = post.views ?? 0;

    if (likesReadable && post.likes === 0 && views >= TRIAL_ZERO_LIKE_REACH) {
      flags[index] = 'NO_LIKES_DESPITE_REACH';
      return;
    }

    // Both halves must hold. A low-reach post that still engaged the audience
    // it reached is simply a quiet post, and a well-seen post with weak
    // engagement is a flop — neither is a trial.
    if (interactionMedian <= 0 || viewsMedian <= 0 || views <= 0) return;
    const coldInteractions =
      post.likes + post.comments <= interactionMedian * TRIAL_INTERACTION_RATIO;
    const coldReach = views <= viewsMedian * TRIAL_VIEWS_RATIO;
    if (coldInteractions && coldReach) {
      flags[index] = 'COLD_AUDIENCE_OUTLIER';
    }
  });

  return flags;
}

/** Human-readable explanation for a flag, shown under the post in the table. */
export function describeTrialFlag(reason: TrialFlagReason): string {
  switch (reason) {
    case 'NO_LIKES_DESPITE_REACH':
      return 'Thousands of views but no likes — this is almost never a post the creator’s own followers saw.';
    case 'COLD_AUDIENCE_OUTLIER':
      return 'Views and engagement are both far below this creator’s median, the usual signature of a reel shown only to non-followers.';
  }
}
