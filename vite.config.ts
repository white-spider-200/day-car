import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_PROXY_TARGET ||
  'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true
      },
      '/images': {
        target: proxyTarget,
        changeOrigin: true
      }
    }
  }
});
