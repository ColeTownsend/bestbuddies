import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import db from '@astrojs/db';
import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react(), db()],

  vite: {
    plugins: [tailwindcss()]
  }
});