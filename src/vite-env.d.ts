/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Branding — see `src/config/branding.ts`. All optional; defaults live there. */
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_TAGLINE?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_DESCRIPTION?: string;
  readonly VITE_APP_LOGO_URL?: string;
  readonly VITE_APP_FAVICON_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
