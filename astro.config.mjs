// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import viteNotesMdxAutolink from './scripts/vite-notes-mdx-autolink.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://pr0p0se.com',
	output: 'static',
	integrations: [mdx(), sitemap()],
	vite: {
		plugins: [viteNotesMdxAutolink()],
	},
	server: {
		host: '0.0.0.0',  // 外部アクセスを許可
		port: 4321
	}
});