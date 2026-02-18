#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import yaml from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const WORKS_DIR = path.join(PROJECT_ROOT, "src", "content", "works");
const TRACKS_DIR = path.join(PROJECT_ROOT, "src", "content", "tracks");

// -------------------- utils --------------------
function getEnv(name, { required = false } = {}) {
  const value = process.env[name];
  if (required && (!value || value.trim() === "")) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

function createSheetsClientFromServiceAccountJson(jsonString) {
  let creds;
  try {
    creds = JSON.parse(jsonString);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON");
  }
  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const privateKey = (creds.private_key || "").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: privateKey,
    scopes,
  });
  return google.sheets({ version: "v4", auth });
}

// ヘッダー名正規化（小文字・トリム・空白→_）
function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase().replace(/\s+/g, "_");
}

// URL/ファイル名用の slug 正規化（小文字・空白→-）
function normalizeSlug(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "-");
}

// 内部照合用 idKey（小文字・空白→-）
// ※ Works.id と Tracks.works_id の照合に使用（ファイル名には使わない）
function normalizeIdKey(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function rowToObject(headers, row) {
  const obj = {};
  for (let i = 0; i < headers.length; i += 1) {
    const key = headers[i];
    if (!key) continue;
    obj[key] = row[i] !== undefined ? String(row[i]) : "";
  }
  return obj;
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
  const m = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseJsonField(jsonStr) {
  if (!jsonStr || jsonStr.trim() === "") return {};
  try {
    const parsed = JSON.parse(jsonStr);
    const cleaned = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") {
        if (v && v.trim() !== "") cleaned[k] = v;
      } else if (v != null) {
        cleaned[k] = v;
      }
    }
    return cleaned;
  } catch {
    console.warn(`Failed to parse JSON field: ${jsonStr}`);
    return {};
  }
}

function parseArrayField(arrayStr) {
  if (!arrayStr || arrayStr.trim() === "") return [];
  try {
    const parsed = JSON.parse(arrayStr);
    return Array.isArray(parsed)
      ? parsed.map(String).filter((v) => v && v.trim() !== "")
      : [];
  } catch {
    console.warn(`Failed to parse array field: ${arrayStr}`);
    return [];
  }
}

async function readExistingBodyIfAny(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = /^---[\s\S]*?---\n?([\s\S]*)$/m.exec(content);
    if (match) return match[1].trim();
    return content.trim();
  } catch {
    return "";
  }
}

function toMdx(frontmatterObject, body) {
  const fm = yaml.stringify(frontmatterObject).trimEnd();
  const fmBlock = `---\n${fm}\n---`;
  const bodyBlock = body ? `\n\n${body}\n` : "\n";
  return fmBlock + bodyBlock;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// -------------------- builders --------------------
function buildWorksFrontmatterAndBody(record) {
  const {
    id = "",
    slug = "",
    title = "",
    release_type = "",
    release_date = "",
    cover_illustration_by = "",
    cover_design_by = "",
    cover_photography_by = "",
    cover_url_list = "",
    links = "",
    release_artist_name = "",
    is_primary_release = "",
    cover_image_url_list = "",
    body = "",
  } = record;

  const fm = {};
  if (id) fm.id = id;           // 内部キー（生値）
  if (slug) fm.slug = slug;     // 表示/URL用
  if (title) fm.title = title;

  const parsedDate = parseDate(release_date);
  if (parsedDate) fm.release_date = parsedDate;

  if (release_type) fm.release_type = release_type.toLowerCase();
  if (release_artist_name) fm.release_artist_name = release_artist_name;

  if (is_primary_release) {
    fm.is_primary_release = String(is_primary_release).toLowerCase() === "true";
  }

  const coverImages = parseArrayField(cover_image_url_list);
  if (coverImages.length > 0) fm.cover_images = coverImages;

  if (cover_illustration_by) fm.cover_illustration_by = cover_illustration_by;
  if (cover_design_by) fm.cover_design_by = cover_design_by;
  if (cover_photography_by) fm.cover_photography_by = cover_photography_by;

  // カバー制作等の外部URL（配列）をそのまま frontmatter へ
  const coverUrls = parseArrayField(cover_url_list);
  if (coverUrls.length > 0) fm.cover_url_list = coverUrls;

  const linksObj = parseJsonField(links);
  if (Object.keys(linksObj).length > 0) fm.links = linksObj;

  // 後で track の id を詰める
  fm.tracks = [];

  return { frontmatter: fm, body: body || "" };
}

function buildTracksFrontmatterAndBody(record) {
  const {
    id = "",
    slug = "",
    track_number = "",
    title = "",
    release_date = "",
    track_type = "",
    lyrics_by = "",
    music_by = "",
    mix_by = "",
    mastering_by = "",
    links = "",
    works_id = "",
    release_id = "", // 後方互換: シート列が release_id のままの場合
    body = "",
  } = record;

  const fm = {};
  if (id) fm.id = id;               // 内部キー（生値）
  if (slug) fm.slug = slug;         // 表示/URL用
  const wid = (works_id || release_id || "").trim();
  if (wid) fm.works_id = wid;

  if (title) fm.title = title;
  if (track_number) {
    const num = parseInt(track_number, 10);
    if (!Number.isNaN(num)) fm.track_number = num;
  }

  const parsedDate = parseDate(release_date);
  if (parsedDate) fm.release_date = parsedDate;

  if (track_type) fm.track_type = track_type;
  if (lyrics_by) fm.lyrics_by = lyrics_by;
  if (music_by) fm.music_by = music_by;
  if (mix_by) fm.mix_by = mix_by;
  if (mastering_by) fm.mastering_by = mastering_by;

  const linksObj = parseJsonField(links);
  if (Object.keys(linksObj).length > 0) fm.links = linksObj;

  return { frontmatter: fm, body: body || "" };
}

// -------------------- sheets processors --------------------
async function processWorksSheet(sheets, spreadsheetId) {
  console.log("Processing Works sheet...");

  const range = "Works!A1:ZZ999";
  const valuesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = valuesRes.data.values || [];
  if (values.length === 0) {
    console.log("No data found in Works sheet.");
    return new Map();
  }

  const headers = values[0].map(normalizeHeader);
  const idIdx = headers.indexOf("id");
  const titleIdx = headers.indexOf("title");
  // slug は任意
  if (idIdx === -1 || titleIdx === -1) {
    throw new Error(
      `Works sheet is missing required columns: need 'id', 'title' (slug optional). Got: ${headers.join(", ")}`
    );
  }

  const worksMap = new Map();
  let totalUpdated = 0, totalCreated = 0, totalSkipped = 0;

  for (let r = 1; r < values.length; r += 1) {
    const row = values[r] || [];
    const rec = rowToObject(headers, row);
    const idRaw = (rec.id || "").trim();
    const titleValue = (rec.title || "").trim();
    const slugRaw = (rec.slug || "").trim();

    if (!idRaw || !titleValue) {
      console.warn(`[WARN] Works Row ${r + 1}: Missing required fields (id or title). Skipped.`);
      totalSkipped += 1;
      continue;
    }

    const { frontmatter, body } = buildWorksFrontmatterAndBody(rec);

    // ファイル名は slug を優先、なければ id を正規化
    const idKey = normalizeIdKey(idRaw);
    const workFileBase = slugRaw ? normalizeSlug(slugRaw) : normalizeSlug(idRaw);
    const filePath = path.join(WORKS_DIR, `${workFileBase}.mdx`);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    let finalBody = body;
    if (exists && (!body || body.trim() === "")) {
      const currentBody = await readExistingBodyIfAny(filePath);
      if (currentBody) finalBody = currentBody;
    }

    await fs.writeFile(filePath, toMdx(frontmatter, finalBody), "utf8");

    // works_id で引くために idKey で登録
    worksMap.set(idKey, { fileBase: workFileBase, frontmatter });

    if (exists) {
      console.log(`[UPDATE] Works: ${workFileBase}.mdx`);
      totalUpdated += 1;
    } else {
      console.log(`[CREATE] Works: ${workFileBase}.mdx`);
      totalCreated += 1;
    }
  }

  console.log(`Works processing done. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
  return worksMap;
}

async function processTracksSheet(sheets, spreadsheetId, worksMap) {
  console.log("Processing Tracks sheet...");

  const range = "Tracks!A1:ZZ999";
  const valuesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = valuesRes.data.values || [];
  if (values.length === 0) {
    console.log("No data found in Tracks sheet.");
    return;
  }

  const headers = values[0].map(normalizeHeader);
  const idIdx = headers.indexOf("id");
  const titleIdx = headers.indexOf("title");
  const worksIdIdx = headers.indexOf("works_id");
  const releaseIdIdx = headers.indexOf("release_id"); // 後方互換
  const releaseIdColIdx = worksIdIdx !== -1 ? worksIdIdx : releaseIdIdx;
  // slug は任意（無ければ id を代用してファイル名にする）
  if (idIdx === -1 || titleIdx === -1 || releaseIdColIdx === -1) {
    throw new Error(
      `Tracks sheet is missing required columns: need 'id', 'title', 'works_id' (or 'release_id') (slug optional). Got: ${headers.join(", ")}`
    );
  }

  let totalUpdated = 0, totalCreated = 0, totalSkipped = 0;
  const tracksByRelease = new Map(); // key: releaseIdKey, val: array of track ids (生値)

  for (let r = 1; r < values.length; r += 1) {
    const row = values[r] || [];
    const rec = rowToObject(headers, row);

    const idRaw = (rec.id || "").trim();
    const titleValue = (rec.title || "").trim();
    const releaseIdRaw = (rec.works_id || rec.release_id || "").trim();
    const slugRaw = (rec.slug || "").trim();

    if (!idRaw || !titleValue || !releaseIdRaw) {
      console.warn(`[WARN] Tracks Row ${r + 1}: Missing required fields (id, title, or works_id). Skipped.`);
      totalSkipped += 1;
      continue;
    }

    const { frontmatter, body } = buildTracksFrontmatterAndBody(rec);

    // ファイル名は slug を優先、なければ id を代用
    const trackFileBase = slugRaw ? normalizeSlug(slugRaw) : normalizeSlug(idRaw);
    const filePath = path.join(TRACKS_DIR, `${trackFileBase}.mdx`);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    let finalBody = body;
    if (exists && (!body || body.trim() === "")) {
      const currentBody = await readExistingBodyIfAny(filePath);
      if (currentBody) finalBody = currentBody;
    }

    await fs.writeFile(filePath, toMdx(frontmatter, finalBody), "utf8");

    // 紐づけは id / works_id（どちらも生値）だが、Works 検索だけ idKey を使う
    const releaseIdKey = normalizeIdKey(releaseIdRaw);
    if (!tracksByRelease.has(releaseIdKey)) tracksByRelease.set(releaseIdKey, []);
    tracksByRelease.get(releaseIdKey).push(idRaw); // ← Works.tracks には Track の「id（生値）」を格納

    if (exists) {
      console.log(`[UPDATE] Track: ${trackFileBase}.mdx (id=${idRaw})`);
      totalUpdated += 1;
    } else {
      console.log(`[CREATE] Track: ${trackFileBase}.mdx (id=${idRaw})`);
      totalCreated += 1;
    }
  }

  // Works に tracks(id) を書き戻し
  console.log("Linking tracks (by id) to works...");
  for (const [releaseIdKey, trackIds] of tracksByRelease) {
    const workInfo = worksMap.get(releaseIdKey);
    if (workInfo) {
      const workFilePath = path.join(WORKS_DIR, `${workInfo.fileBase}.mdx`);
      const currentBody = await readExistingBodyIfAny(workFilePath);
      const updatedFrontmatter = { ...workInfo.frontmatter, tracks: trackIds };
      await fs.writeFile(workFilePath, toMdx(updatedFrontmatter, currentBody), "utf8");
      console.log(`[LINK] Added ${trackIds.length} tracks to ${workInfo.fileBase}.mdx (ids: ${trackIds.join(", ")})`);
    } else {
      console.warn(`[WARN] Release ID key "${releaseIdKey}" not found in Works sheet`);
    }
  }

  console.log(`Tracks processing done. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
}

// -------------------- main --------------------
async function main() {
  const serviceAccountJson = getEnv("GOOGLE_SERVICE_ACCOUNT", { required: true });
  const spreadsheetId = getEnv("GOOGLE_SHEETS_ID", { required: true });

  const sheets = createSheetsClientFromServiceAccountJson(serviceAccountJson);

  await ensureDir(WORKS_DIR);
  await ensureDir(TRACKS_DIR);

  const worksMap = await processWorksSheet(sheets, spreadsheetId);
  await processTracksSheet(sheets, spreadsheetId, worksMap);

  console.log("\nAll processing completed successfully!");
}

main().catch((err) => {
  console.error("Sync failed:", err?.message || err);
  process.exit(1);
});
