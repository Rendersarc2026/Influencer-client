/**
 * Every brand-facing value the app renders, resolved once from the environment.
 *
 * `.env` is the single source of truth: change `VITE_APP_NAME` there and the
 * sidebar, the login screen, the browser tab and the favicon all follow. The
 * fallbacks below keep a checkout without a local `.env` — the file is
 * gitignored — rendering the current brand rather than blank chrome.
 *
 * The same defaults are mirrored in `vite.config.ts`, which needs them before
 * any module of this app is loaded in order to write `index.html`.
 */
const read = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const name = read(import.meta.env.VITE_APP_NAME, 'Fetch');

// An explicitly empty tagline is a choice (name-only title), so only an unset
// variable falls back.
const tagline =
  import.meta.env.VITE_APP_TAGLINE === undefined
    ? 'Influencer Marketing Platform'
    : import.meta.env.VITE_APP_TAGLINE.trim();

export const branding = {
  /** Product name, as shown to users. */
  name,
  tagline,
  /** Browser tab title, composed from the name unless `VITE_APP_TITLE` sets it. */
  title: read(import.meta.env.VITE_APP_TITLE, tagline ? `${name} | ${tagline}` : name),
  description: read(import.meta.env.VITE_APP_DESCRIPTION, tagline || name),
  /** Public path or absolute URL of the in-app logo. */
  logoUrl: read(import.meta.env.VITE_APP_LOGO_URL, '/fetch-logo.jpeg'),
  faviconUrl: read(import.meta.env.VITE_APP_FAVICON_URL, '/favicon.png'),
} as const;

/**
 * Re-applies the title and favicon at runtime.
 *
 * `index.html` is already stamped at build time, but it is a separately cached
 * document — a browser holding an old copy would otherwise keep showing the
 * previous brand next to a freshly built bundle.
 */
export function applyBrandingToDocument(): void {
  document.title = branding.title;

  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  if (icon.getAttribute('href') !== branding.faviconUrl) {
    icon.setAttribute('href', branding.faviconUrl);
  }
}
