import { queryClient } from './query.client';
import { agencyCampaignsQueryOptions, agencyDashboardSummaryQueryOptions } from './agency.api';
import {
  brandCampaignsQueryOptions,
  brandDashboardSummaryQueryOptions,
  brandProfileQueryOptions,
} from './brand.api';

/**
 * Boot-time data prefetch.
 *
 * The route guards cannot render a dashboard until `/auth/me` resolves, so the
 * dashboard's own queries would not even be issued until a full round trip
 * later — the session check and the data fetch ran back to back. Nothing the
 * dashboard asks for depends on the answer, so we start both at once and let
 * the guard do its job while the data is already in flight.
 *
 * Called before React renders, so the requests leave as early as possible.
 *
 * Each entry must match the params the corresponding home screen mounts with,
 * or the warmed entry sits unused under a different key — which is why the
 * query options are imported from the API modules rather than restated here.
 *
 * If the visitor turns out not to hold that role the responses are simply
 * discarded: a signed-out visitor is redirected to login by the guard (and by
 * the 401 interceptor) exactly as before, and a signed-in user of another role
 * gets a 403, which does not disturb their session.
 */
const FIRST_PAGE = { page: 1, limit: 10 };

export function prefetchForRoute(pathname: string): void {
  if (pathname.startsWith('/agency')) {
    void queryClient.prefetchQuery(agencyCampaignsQueryOptions(FIRST_PAGE));
    // The home screen's tiles come from the summary now; warming the brand
    // list here fetched rows the screen no longer reads.
    void queryClient.prefetchQuery(agencyDashboardSummaryQueryOptions());
    return;
  }

  if (pathname.startsWith('/brand')) {
    void queryClient.prefetchQuery(brandCampaignsQueryOptions(FIRST_PAGE));
    void queryClient.prefetchQuery(brandDashboardSummaryQueryOptions());
    void queryClient.prefetchQuery(brandProfileQueryOptions());
  }
}
