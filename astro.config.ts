import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import db from '@astrojs/db';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), db()],

  vite: {
    plugins: [tailwindcss()]
  },
  experimental: {
    fonts: [{
      provider: fontProviders.google(),
      name: "Silkscreen",
      cssVariable: "--font-silkscreen"
    }]
  }
});