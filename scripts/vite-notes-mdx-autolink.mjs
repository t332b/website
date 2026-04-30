/**
 * Vite plugin: notes の .mdx 用の前処理
 * - 連続する空行を <br /> に変換して視覚的なスペースを保持する
 * - `<https://...>` 形式のURLを Markdown リンク [url](url) に変換
 * - 単独行のURLを NoteEmbedLink コンポーネントに変換
 * - HTML void 要素を JSX 互換の自己閉じタグに変換（<br> → <br /> 等）
 */
import path from "node:path";

const NOTES_MDX_RE = /content[/\\]notes[/\\].*\.mdx$/i;

/**
 * 連続する空行を <br /> に変換して視覚的なスペースを保持する
 * 例: 段落間に空行が2つあれば <br /> が1つ挿入される
 */
function preserveBlankLines(source) {
  // \n\n\n 以上（= 空行2つ以上）を検出し、余分な空行ぶん <br /> を挿入する
  return source.replace(/(\n{3,})/g, (match) => {
    const extraLines = match.length - 2; // 段落区切りの2つ分を引いた余分な改行数
    return "\n\n" + "<br />\n".repeat(extraLines) + "\n";
  });
}

/** 角括弧で囲まれた http(s) URL を [url](url) に置換 */
function transformAngleBracketUrls(source) {
  return source.replace(/<(https?:\/\/[^>]+)>/g, (_, url) => `[${url}](${url})`);
}

/**
 * 1行にURLだけが書かれている / 自動リンクだけが書かれている場合に、
 * NoteEmbedLink コンポーネントへ変換する（プレーヤー埋め込み等）
 */
function transformStandaloneLinksToEmbeds(source) {
  const urlOnlyRe = /^https?:\/\/\S+$/;
  const mdAutolinkRe = /^\[(https?:\/\/[^\]\s]+)\]\(\1\)$/;

  const lines = source.split(/\r?\n/);
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    let url = null;
    const m = trimmed.match(mdAutolinkRe);
    if (m) url = m[1];
    else if (urlOnlyRe.test(trimmed)) url = trimmed;

    if (!url) continue;

    // 箇条書きの中などは変換しない（意図しない崩れを防ぐ）
    if (/^[-*+]\s+/.test(trimmed)) continue;
    if (/^>\s+/.test(trimmed)) continue;

    lines[i] = `<NoteEmbedLink href="${url}">${url}</NoteEmbedLink>`;
    changed = true;
  }

  if (!changed) return source;

  // NoteEmbedLink の import がなければ挿入する（frontmatter があればその直後）
  const importLine = `import NoteEmbedLink from "../../components/NoteEmbedLink.astro";`;
  const joined = lines.join("\n");
  if (/import\s+NoteEmbedLink\s+from\s+['"]/.test(source)) {
    return joined;
  }
  if (/^\s*---\s*\n[\s\S]*?\n---\s*\n/m.test(joined)) {
    // frontmatter の直後に挿入
    return joined.replace(/^(\s*---\s*\n[\s\S]*?\n---\s*\n)/m, `$1${importLine}\n\n`);
  }
  return `${importLine}\n\n${joined}`;
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
      let result = preserveBlankLines(code);
      result = transformAngleBracketUrls(result);
      result = transformStandaloneLinksToEmbeds(result);
      result = closeVoidElements(result);
      return { code: result, map: null };
    },
  };
}
