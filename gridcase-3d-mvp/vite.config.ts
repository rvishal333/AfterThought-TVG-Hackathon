import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/morph': {
        target: 'https://api.morphllm.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/morph/, '/v1'),
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
