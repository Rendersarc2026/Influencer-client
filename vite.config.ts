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
});
