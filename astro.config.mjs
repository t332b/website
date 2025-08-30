// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import decapCmsOauth from 'astro-decap-cms-oauth';
import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
	site: 'https://pr0p0se.com',
	output: 'static',
	integrations: [mdx(), sitemap(), decapCmsOauth()],
	adapter: vercel(),
});
