import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      '@context': path.resolve(__dirname, './src/context'),
      '@store': path.resolve(__dirname, './src/store'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    // Source maps are emitted so a production stack trace is readable. Serve or
    // withhold the .map files independently of the bundle.
    sourcemap: true,
    // No manualChunks map here on purpose.
    //
    // A hand-written package->chunk map kept producing circular chunks
    // (vendor-charts <-> vendor-mui), and because the MUI chunk loads on every
    // page, the cycle pulled the ~150kB chart bundle into every initial load —
    // for roles that never render a chart. Shared transitive dependencies are
    // exactly what a static map gets wrong.
    //
    // Rollup's own grouping handles this correctly once the heavy dependency is
    // behind a dynamic import, which is what molecules/LazyChartCard does for
    // recharts.
  },
  server: {
    port: 5173,
    host: true,
  },
});
