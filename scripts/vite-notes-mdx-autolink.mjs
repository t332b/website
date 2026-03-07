/**
 * Vite plugin: notes の .mdx 用の前処理
 * `<https://...>` 形式のURLを Markdown リンク [url](url) に変換
 */
import path from "node:path";

const NOTES_MDX_RE = /content[/\\]notes[/\\].*\.mdx$/i;

/** 角括弧で囲まれた http(s) URL を [url](url) に置換 */
function transformAngleBracketUrls(source) {
  return source.replace(/<(https?:\/\/[^>]+)>/g, (_, url) => `[${url}](${url})`);
}

function isNotesMdx(id) {
  return NOTES_MDX_RE.test(path.normalize(id));
}

export default function viteNotesMdxAutolink() {
  return {
    name: "vite-notes-mdx-autolink",
    enforce: "pre",
    transform(code, id) {
      if (!isNotesMdx(id)) return null;
      return { code: transformAngleBracketUrls(code), map: null };
    },
  };
}
