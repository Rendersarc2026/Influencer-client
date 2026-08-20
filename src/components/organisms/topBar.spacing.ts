/**
 * Geometry shared by every page header, so a route with breadcrumbs, a back
 * button or a right-hand action is exactly as tall as one without. The loading
 * shimmer imports these too, so a header never changes height when real data
 * swaps in.
 *
 * The header is a fixed height with horizontal-only padding: vertical space
 * comes from centring the content inside `TOPBAR_HEIGHT` rather than from
 * padding, which is what kept the height varying with the content before.
 *
 * Kept out of TopBar.tsx so that file stays component-only and fast refresh
 * keeps working on it.
 */

/** Fixed outer height of the header at every breakpoint (border-box). */
export const TOPBAR_HEIGHT = { xs: 64, sm: 78, md: 92 };

/** Horizontal padding only — vertical centring handles the rest. */
export const TOPBAR_PADDING = { xs: '0 14px', sm: '0 18px', md: '0 24px' };

/** Square footprint every header control shares: icon buttons, right action, user menu. */
export const TOPBAR_CONTROL_SIZE = { xs: 34, sm: 38 };

/** Icon glyph size inside a header control. */
export const TOPBAR_ICON_SIZE = { xs: 19, sm: 20 };

/** Gap between controls in the right-hand cluster. */
export const TOPBAR_CONTROL_GAP = { xs: 0.75, sm: 1.25 };

/** Corner radius for the square header controls. */
export const TOPBAR_CONTROL_RADIUS = '10px';
