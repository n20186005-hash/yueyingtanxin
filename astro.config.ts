import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 網域確定後，只需在此填入完整 HTTPS 網址；留空仍可正常建置。
const site = '';

export default defineConfig({
  site: site || undefined,
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
