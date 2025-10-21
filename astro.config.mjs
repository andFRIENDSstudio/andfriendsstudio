import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel'; // Remove '/serverless'

export default defineConfig({
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
  integrations: [react()],
});