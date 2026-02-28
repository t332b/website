// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import viteNotesMdxAutolink from './scripts/vite-notes-mdx-autolink.mjs';

const rawBasePath = process.env.ASTRO_BASE_PATH || '/';
const normalizedBasePath = rawBasePath === '/'
	? '/'
	: `/${rawBasePath.replace(/^\/+|\/+$/g, '')}/`;

// https://astro.build/config
export default defineConfig({
	site: 'https://pr0p0se.com',
	base: normalizedBasePath,
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