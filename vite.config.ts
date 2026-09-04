import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const FAVICON_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Stamps the branding from `.env` into `index.html`.
 *
 * The app itself reads the same variables through `src/config/branding.ts`,
 * but the document head is written before any module runs, so the title,
 * description and favicon are substituted here. Defaults are kept in step with
 * that module. Placeholders are `%APP_*%` rather than `%VITE_*%` so Vite's own
 * HTML env replacement leaves them to this plugin.
 */
function brandingHtmlPlugin(env: Record<string, string>): Plugin {
  const name = env.VITE_APP_NAME?.trim() || 'Fetch';
  const tagline =
    env.VITE_APP_TAGLINE === undefined
      ? 'Influencer Marketing Platform'
      : env.VITE_APP_TAGLINE.trim();
  const title = env.VITE_APP_TITLE?.trim() || (tagline ? `${name} | ${tagline}` : name);
  const description = env.VITE_APP_DESCRIPTION?.trim() || tagline || name;
  const faviconUrl = env.VITE_APP_FAVICON_URL?.trim() || '/favicon.png';
  const faviconType =
    FAVICON_MIME_TYPES[path.extname(faviconUrl.split('?')[0]).toLowerCase()] || 'image/png';

  const replacements: Record<string, string> = {
    '%APP_NAME%': escapeHtml(name),
    '%APP_TITLE%': escapeHtml(title),
    '%APP_DESCRIPTION%': escapeHtml(description),
    '%APP_FAVICON_URL%': escapeHtml(faviconUrl),
    '%APP_FAVICON_TYPE%': faviconType,
  };

  return {
    name: 'branding-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        Object.entries(replacements).reduce(
          (out, [token, value]) => out.split(token).join(value),
          html,
        ),
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // '' loads every variable, not only the VITE_-prefixed ones, which keeps the
  // branding lookups above identical to what the app sees.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), brandingHtmlPlugin(env)],
    resolve: {
      alias: {
        '@atoms': path.resolve(__dirname, './src/components/atoms'),
        '@molecules': path.resolve(__dirname, './src/components/molecules'),
        '@organisms': path.resolve(__dirname, './src/components/organisms'),
        '@templates': path.resolve(__dirname, './src/components/templates'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@theme': path.resolve(__dirname, './src/theme'),
        '@contracts': path.resolve(__dirname, './src/contracts'),
        '@api': path.resolve(__dirname, './src/api'),
        '@routes': path.resolve(__dirname, './src/routes'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
        '@context': path.resolve(__dirname, './src/context'),
        '@store': path.resolve(__dirname, './src/store'),
        '@types': path.resolve(__dirname, './src/types'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      // 'hidden' still emits maps for upload to an error tracker but drops the
      // //# sourceMappingURL comment, so the deployed bundle does not advertise
      // ~8.5MB of original TypeScript to anyone who fetches it.
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('@mui/icons-material')) {
                return 'vendor-icons';
              }
              if (
                id.includes('@tanstack') ||
                id.includes('axios') ||
                id.includes('@reduxjs') ||
                id.includes('react-redux') ||
                id.includes('socket.io-client')
              ) {
                return 'vendor-data';
              }
              if (id.includes('zod')) {
                return 'vendor-forms';
              }
              if (id.includes('@mui') || id.includes('@emotion') || id.includes('react')) {
                return 'vendor-ui';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
