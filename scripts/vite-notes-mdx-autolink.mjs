/**
 * Vite plugin: notes の .mdx 用の前処理
 * - `<https://...>` 形式のURLを Markdown リンク `[url](url)` に変換
 * - 本文中の 3 回以上の連続改行をスペーサー用 HTML に置換（表示で空白を保持）
 */
import path from "node:path";

const NOTES_MDX_RE = /content[/\\]notes[/\\].*\.mdx$/i;

const SPACER_HTML = "\n\n<div class=\"content-spacer\" aria-hidden=\"true\"></div>\n\n";

/** 角括弧で囲まれた http(s) URL を [url](url) に置換 */
function transformAngleBracketUrls(source) {
  return source.replace(/<(https?:\/\/[^>]+)>/g, (_, url) => `[${url}](${url})`);
}

/** 本文（frontmatter の後）の 3 回以上の連続改行をスペーサーに置換 */
function preserveBlankLinesInBody(source) {
  const idx = source.indexOf("\n---\n");
  const bodyStart = idx !== -1 ? idx + 5 : 0;
  const head = source.slice(0, bodyStart);
  const body = source.slice(bodyStart);
  const newBody = body.replace(/\n{3,}/g, SPACER_HTML);
  return head + newBody;
}

function isNotesMdx(id) {
  return NOTES_MDX_RE.test(path.normalize(id));
}

function transformNotesMdx(code) {
  return preserveBlankLinesInBody(transformAngleBracketUrls(code));
}

export default function viteNotesMdxAutolink() {
  return {
    name: "vite-notes-mdx-autolink",
    enforce: "pre",
    transform(code, id) {
      if (!isNotesMdx(id)) return null;
      return { code: transformNotesMdx(code), map: null };
    },
  };
}
