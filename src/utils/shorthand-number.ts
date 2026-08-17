/**
 * Utility for parsing and formatting shorthand numbers (e.g., 10k, 100k, 1m).
 * Rejects negative values and non-standard formats.
 */

/**
 * Parses shorthand string like "10k", "100k", "1m", "1.5M", "500" into a positive integer.
 * Returns null if invalid or negative.
 */
export function parseShorthandNumber(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed.includes('-')) return null;

  // Match digits with optional decimal and optional k, m, b suffix
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num < 0) return null;

  const suffix = (match[2] || '').toLowerCase();
  let multiplier = 1;
  if (suffix === 'k') multiplier = 1_000;
  else if (suffix === 'm') multiplier = 1_000_000;
  else if (suffix === 'b') multiplier = 1_000_000_000;

  const total = Math.round(num * multiplier);
  if (total > 2_147_483_647 || total < 0) return null;
  return total;
}

/**
 * Formats a number to shorthand notation (e.g., 10000 -> "10k", 100000 -> "100k", 1000000 -> "1m", 1500 -> "1.5k").
 */
export function formatShorthandNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  if (value < 0) return '';
  if (value < 1_000) return value.toString();
  if (value < 1_000_000) {
    const k = value / 1_000;
    const formatted = parseFloat(k.toFixed(2)).toString();
    return `${formatted}k`;
  }
  if (value < 1_000_000_000) {
    const m = value / 1_000_000;
    const formatted = parseFloat(m.toFixed(2)).toString();
    return `${formatted}m`;
  }
  const b = value / 1_000_000_000;
  const formatted = parseFloat(b.toFixed(2)).toString();
  return `${formatted}b`;
}

/**
 * Formats a follower count with fallback for display tables/cards (e.g. 10k, 100k, 1m, or "—").
 */
export function formatFollowersDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value < 0) return '—';
  if (value === 0) return '0';
  return formatShorthandNumber(value);
}
