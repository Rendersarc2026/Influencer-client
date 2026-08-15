import { queryClient } from './query.client';
import { adminPlatformStatsQueryOptions, adminUsersQueryOptions } from './admin.api';

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
 * If the visitor turns out not to be an admin the responses are simply
 * discarded: a signed-out visitor is redirected to login by the guard (and by
 * the 401 interceptor) exactly as before, and a signed-in non-admin gets a 403,
 * which does not disturb their session.
 */
export function prefetchForRoute(pathname: string): void {
  if (!pathname.startsWith('/admin')) return;

  // Must match the defaults AdminHomeOrganism mounts with, or the warmed
  // entry sits unused under a different key.
  void queryClient.prefetchQuery(adminUsersQueryOptions({ page: 1, limit: 10 }));
  void queryClient.prefetchQuery(adminPlatformStatsQueryOptions());
}
