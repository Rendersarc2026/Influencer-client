/**
 * Vertical breathing room around the page title, shared by every route. The
 * loading shimmer imports this too, so a header never changes height when real
 * data swaps in. Kept out of TopBar.tsx so that file stays component-only and
 * fast refresh keeps working on it.
 */
export const TOPBAR_PADDING = { xs: '14px 14px', sm: '16px 18px', md: '18px 24px' };
