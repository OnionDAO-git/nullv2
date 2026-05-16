import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    proxy: {
      // Forward API calls to the Hono server during dev
      '/v1': {
        target: process.env.PUBLIC_API_URL ?? 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
