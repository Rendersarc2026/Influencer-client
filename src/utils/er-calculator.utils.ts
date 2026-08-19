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
export function calculatePreEvalCpv(
  commercialFee: number,
  committedViews: number,
): number | null {
  if (commercialFee <= 0 || committedViews <= 0) return null;
  const cpv = commercialFee / committedViews;
  return parseFloat(cpv.toFixed(2));
}

/**
 * Parses numeric string supporting commas, decimals, and shorthand (e.g. 10k, 1.5M, 50,000).
 */
export function parseNumberInput(input: string | number | null | undefined): number {
  if (typeof input === 'number') return isNaN(input) || input < 0 ? 0 : input;
  if (!input) return 0;
  const shorthand = parseShorthandNumber(input);
  if (shorthand !== null) return shorthand;
  const clean = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed);
}

/**
 * Parses a bulk text containing numbers separated by commas, spaces, tabs, or newlines.
 */
export function parseNumberList(input: string): number[] {
  if (!input) return [];
  const parts = input.split(/[\n,\t\s]+/).filter((p) => p.trim().length > 0);
  const results: number[] = [];
  for (const part of parts) {
    const val = parseNumberInput(part);
    if (val > 0) {
      results.push(val);
    }
  }
  return results;
}
