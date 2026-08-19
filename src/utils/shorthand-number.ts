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
 * Formats a follower count for read-only display in tables, cards and drawers:
 * "64.7k" reads better than "64700" in a list of reach numbers.
 *
 * Distinct from `formatShorthandNumber`, which round-trips values back into
 * editable text inputs and must stay reversible by `parseShorthandNumber`.
 */
export function formatFollowersDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(value);
}

export type InfluencerTier = 'NANO' | 'MICRO' | 'MACRO' | 'MEGA';

export interface InfluencerTierInfo {
  key: InfluencerTier;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
  defaultFollowers: number;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

export const INFLUENCER_TIERS: InfluencerTierInfo[] = [
  {
    key: 'NANO',
    label: 'Nano',
    rangeLabel: '1k – 10k',
    min: 1_000,
    max: 10_000,
    defaultFollowers: 5_000,
    description: '1k – 10k followers',
    color: {
      bg: '#EEF2FF',
      text: '#4F46E5',
      border: '#C7D2FE',
    },
  },
  {
    key: 'MICRO',
    label: 'Micro',
    rangeLabel: '10k – 100k',
    min: 10_000,
    max: 100_000,
    defaultFollowers: 50_000,
    description: '10k – 100k followers',
    color: {
      bg: '#ECFDF5',
      text: '#059669',
      border: '#A7F3D0',
    },
  },
  {
    key: 'MACRO',
    label: 'Macro',
    rangeLabel: '100k – 1M',
    min: 100_000,
    max: 1_000_000,
    defaultFollowers: 250_000,
    description: '100k – 1M followers',
    color: {
      bg: '#FFFBEB',
      text: '#D97706',
      border: '#FDE68A',
    },
  },
  {
    key: 'MEGA',
    label: 'Mega',
    rangeLabel: '1M+',
    min: 1_000_000,
    max: Infinity,
    defaultFollowers: 1_500_000,
    description: '1M+ followers',
    color: {
      bg: '#FAF5FF',
      text: '#9333EA',
      border: '#E9D5FF',
    },
  },
];

export function getInfluencerTier(followers: number | null | undefined): InfluencerTier | null {
  if (followers === null || followers === undefined || isNaN(followers) || followers <= 0) {
    return null;
  }
  if (followers < 10_000) return 'NANO';
  if (followers < 100_000) return 'MICRO';
  if (followers < 1_000_000) return 'MACRO';
  return 'MEGA';
}

export function getTierInfo(tier: InfluencerTier | string | null | undefined): InfluencerTierInfo | null {
  if (!tier) return null;
  const upper = tier.toUpperCase();
  return INFLUENCER_TIERS.find((t) => t.key === upper || t.label.toUpperCase() === upper) || null;
}
