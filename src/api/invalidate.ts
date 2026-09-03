import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * What a write affects, in cache terms.
 *
 * Mutations used to invalidate only the list they were fired from, so an edit
 * was invisible everywhere else until a full page reload: `staleTime` is ten
 * minutes and `refetchOnWindowFocus` is off, so a view that is never
 * invalidated simply keeps serving the copy it already has. The dashboards and
 * the reports rollup were never invalidated by anything at all.
 *
 * Naming the fan-out once, here, is what keeps that from drifting again — a new
 * mutation picks the entity it touches instead of trying to remember every
 * screen that happens to render it.
 */
export type EntityKind =
  | 'brand'
  | 'campaign'
  | 'influencer'
  | 'assignment'
  | 'payment'
  | 'user'
  | 'category'
  | 'location'
  | 'profile';

/** Headline counts. Every write moves at least one of these. */
const DASHBOARDS: QueryKey[] = [
  ['agency', 'dashboard'],
  ['brand', 'dashboard'],
  ['influencer', 'dashboard'],
];

/** Rollup and per-campaign report batches, derived from campaign + mapper rows. */
const REPORTS: QueryKey[] = [['agency', 'reports']];

/** The same campaign is listed under three roles; an edit shows in all of them. */
const CAMPAIGNS: QueryKey[] = [
  ['agency', 'campaigns'],
  ['brand', 'campaigns'],
  ['influencer', 'campaigns'],
  ['influencer', 'assignments'],
];

const BRANDS: QueryKey[] = [
  ['agency', 'brands'],
  ['brand', 'profile'],
];

const INFLUENCERS: QueryKey[] = [
  ['agency', 'influencers'],
  ['influencer', 'assignments'],
];
const MAPPERS: QueryKey[] = [
  ['agency', 'mappers'],
  ['agency', 'campaigns'],
  ['brand', 'campaigns'],
];
const USERS: QueryKey[] = [['agency', 'users']];
const PAYMENTS: QueryKey[] = [['brand', 'payments']];

const AFFECTED: Record<EntityKind, QueryKey[]> = {
  // A brand's name and logo are rendered on every campaign that belongs to it,
  // and its manager shows up in the users list.
  brand: [...BRANDS, ...CAMPAIGNS, ...USERS, ...DASHBOARDS, ...REPORTS],
  campaign: [...CAMPAIGNS, ...MAPPERS, ...DASHBOARDS, ...REPORTS, ...PAYMENTS],
  // A creator is denormalised onto every assignment row that references them.
  influencer: [...INFLUENCERS, ...CAMPAIGNS, ...MAPPERS, ...USERS, ...DASHBOARDS, ...REPORTS],
  // Rates, metrics, pre-evals, brand decisions — everything hung off a mapper.
  assignment: [...CAMPAIGNS, ...MAPPERS, ...PAYMENTS, ...INFLUENCERS, ...DASHBOARDS, ...REPORTS],
  payment: [...PAYMENTS, ...CAMPAIGNS, ...DASHBOARDS, ...REPORTS],
  user: [...USERS, ...BRANDS, ...INFLUENCERS, ...DASHBOARDS],
  // Renaming or archiving one relabels every row classified under it.
  category: [['categories'], ...INFLUENCERS, ...BRANDS, ...CAMPAIGNS],
  location: [['locations'], ...INFLUENCERS, ...BRANDS, ...CAMPAIGNS],
  profile: [['auth', 'me'], ...BRANDS, ...INFLUENCERS, ...USERS, ...DASHBOARDS],
};

/**
 * Marks every view an entity appears in as out of date and triggers real-time updates.
 */
export function invalidateEntity(queryClient: QueryClient, ...kinds: EntityKind[]): void {
  const seen = new Set<string>();

  for (const kind of kinds) {
    for (const queryKey of AFFECTED[kind]) {
      const hash = JSON.stringify(queryKey);
      if (seen.has(hash)) continue;
      seen.add(hash);
      queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
    }
  }
}
