// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import viteNotesMdxAutolink from './scripts/vite-notes-mdx-autolink.mjs';

function normalizeBasePath(value) {
	// 未指定 or "/" はルート
	if (!value || value === '/') return '/';

	// "stg" / "/stg" / "/stg/" どれでも受けて "/stg/" に統一
	const trimmed = String(value).replace(/^\/+|\/+$/g, '');
	return `/${trimmed}/`;
}

const base = normalizeBasePath(process.env.ASTRO_BASE_PATH);

export default defineConfig({
	site: 'https://pr0p0se.com',
	base,
	output: 'static',
	integrations: [mdx(), sitemap()],
	vite: {
		plugins: [viteNotesMdxAutolink()],
	},
	server: {
		host: '0.0.0.0',
		port: 4321,
	},
});