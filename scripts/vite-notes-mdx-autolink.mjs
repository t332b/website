/**
 * Vite plugin: notes の .mdx 用の前処理
 * - `<https://...>` 形式のURLを Markdown リンク [url](url) に変換
 * - HTML void 要素を JSX 互換の自己閉じタグに変換（<br> → <br /> 等）
 */
import path from "node:path";

const NOTES_MDX_RE = /content[/\\]notes[/\\].*\.mdx$/i;

/** 角括弧で囲まれた http(s) URL を [url](url) に置換 */
function transformAngleBracketUrls(source) {
  return source.replace(/<(https?:\/\/[^>]+)>/g, (_, url) => `[${url}](${url})`);
}

const VOID_ELEMENTS = [
  "area","base","br","col","embed","hr","img","input",
  "link","meta","param","source","track","wbr",
];
const VOID_RE = new RegExp(
  `<(${VOID_ELEMENTS.join("|")})(\\s[^>]*)?\\/?>`,
  "gi",
);

/** <br> や <img src="..."> 等の void 要素を <br /> / <img src="..." /> に変換 */
function closeVoidElements(source) {
  return source.replace(VOID_RE, (_, tag, attrs) => {
    const a = (attrs ?? "").replace(/\/\s*$/, "").trimEnd();
    return `<${tag}${a} />`;
  });
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
      let result = transformAngleBracketUrls(code);
      result = closeVoidElements(result);
      return { code: result, map: null };
    },
  };
}
