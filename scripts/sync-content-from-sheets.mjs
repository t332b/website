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
  } catch (e) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON");
  }

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ];

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes,
  });

  return google.sheets({ version: "v4", auth });
}

function normalizeHeader(header) {
  return String(header || "").trim();
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
  
  // YYYY/MM/DD 形式をパース
  const match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

function parseJsonField(jsonStr) {
  if (!jsonStr || jsonStr.trim() === "") return {};
  try {
    const parsed = JSON.parse(jsonStr);
    // 空文字列のプロパティを削除
    const cleaned = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value && value.trim() !== "") {
        cleaned[key] = value;
      }
    }
    return cleaned;
  } catch (e) {
    console.warn(`Failed to parse JSON field: ${jsonStr}`);
    return {};
  }
}

function parseArrayField(arrayStr) {
  if (!arrayStr || arrayStr.trim() === "") return [];
  try {
    const parsed = JSON.parse(arrayStr);
    return Array.isArray(parsed) ? parsed.filter(v => v && v.trim() !== "") : [];
  } catch (e) {
    console.warn(`Failed to parse array field: ${arrayStr}`);
    return [];
  }
}

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
    links = "",
    release_artist_name = "",
    is_primary_release = "",
    cover_image_url_list = "",
    body = "",
  } = record;

  const fm = {};
  
  if (id) fm.id = id;
  if (title) fm.title = title;
  
  const parsedDate = parseDate(release_date);
  if (parsedDate) fm.release_date = parsedDate;
  
  if (release_type && release_type.toLowerCase() !== "") {
    fm.release_type = release_type.toLowerCase();
  }
  
  if (release_artist_name) fm.release_artist_name = release_artist_name;
  
  if (is_primary_release) {
    fm.is_primary_release = is_primary_release.toLowerCase() === "true";
  }
  
  const coverImages = parseArrayField(cover_image_url_list);
  if (coverImages.length > 0) fm.cover_images = coverImages;
  
  if (cover_illustration_by) fm.cover_illustration_by = cover_illustration_by;
  if (cover_design_by) fm.cover_design_by = cover_design_by;
  if (cover_photography_by) fm.cover_photography_by = cover_photography_by;
  
  const linksObj = parseJsonField(links);
  if (Object.keys(linksObj).length > 0) fm.links = linksObj;
  
  // デフォルトで空配列（後でtracksを追加）
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
    body = "",
  } = record;

  const fm = {};
  
  if (id) fm.id = id;
  if (title) fm.title = title;
  if (track_number) fm.track_number = parseInt(track_number, 10);
  
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

async function readExistingBodyIfAny(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = /^---[\s\S]*?---\n?([\s\S]*)$/m.exec(content);
    if (match) return match[1].trim();
    return content.trim();
  } catch (e) {
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

async function processWorksSheet(sheets, spreadsheetId) {
  console.log("Processing Works sheet...");
  
  const range = "'Works'";
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = valuesRes.data.values || [];
  
  if (values.length === 0) {
    console.log("No data found in Works sheet.");
    return new Map();
  }

  const headers = values[0].map(normalizeHeader);
  const slugIdx = headers.indexOf("slug");
  const titleIdx = headers.indexOf("title");
  const idIdx = headers.indexOf("id");
  
  if (slugIdx === -1 || titleIdx === -1 || idIdx === -1) {
    throw new Error("Works sheet is missing required columns: 'id', 'slug', and/or 'title'");
  }

  const worksMap = new Map();
  let totalUpdated = 0;
  let totalCreated = 0;
  let totalSkipped = 0;

  for (let r = 1; r < values.length; r += 1) {
    const row = values[r];
    const rec = rowToObject(headers, row);
    const slug = (rec.slug || "").trim();
    const titleValue = (rec.title || "").trim();
    const id = (rec.id || "").trim();
    
    if (!slug || !titleValue || !id) {
      console.warn(`[WARN] Works Row ${r + 1}: Missing required fields (id, slug, or title). Skipped.`);
      totalSkipped += 1;
      continue;
    }

    const { frontmatter, body } = buildWorksFrontmatterAndBody(rec);
    const filePath = path.join(WORKS_DIR, `${slug}.mdx`);

    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    let finalBody = body;
    if (exists && (!body || body.trim() === "")) {
      // シート側にbody未入力なら既存本文を保持
      const currentBody = await readExistingBodyIfAny(filePath);
      if (currentBody) finalBody = currentBody;
    }

    const mdx = toMdx(frontmatter, finalBody);
    await fs.writeFile(filePath, mdx, "utf8");
    
    // Works情報をマップに保存（後でtracksとリンクするため）
    worksMap.set(id, { slug, frontmatter });
    
    if (exists) {
      console.log(`[UPDATE] Works: ${slug}.mdx`);
      totalUpdated += 1;
    } else {
      console.log(`[CREATE] Works: ${slug}.mdx`);
      totalCreated += 1;
    }
  }

  console.log(`Works processing done. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
  return worksMap;
}

async function processTracksSheet(sheets, spreadsheetId, worksMap) {
  console.log("Processing Tracks sheet...");
  
  const range = "'Tracks'";
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = valuesRes.data.values || [];
  
  if (values.length === 0) {
    console.log("No data found in Tracks sheet.");
    return;
  }

  const headers = values[0].map(normalizeHeader);
  const slugIdx = headers.indexOf("slug");
  const titleIdx = headers.indexOf("title");
  const idIdx = headers.indexOf("id");
  const releaseIdIdx = headers.indexOf("release_id");
  
  if (slugIdx === -1 || titleIdx === -1 || idIdx === -1 || releaseIdIdx === -1) {
    throw new Error("Tracks sheet is missing required columns: 'id', 'slug', 'title', and/or 'release_id'");
  }

  let totalUpdated = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  const tracksByRelease = new Map();

  for (let r = 1; r < values.length; r += 1) {
    const row = values[r];
    const rec = rowToObject(headers, row);
    const slug = (rec.slug || "").trim();
    const titleValue = (rec.title || "").trim();
    const id = (rec.id || "").trim();
    const releaseId = (rec.release_id || "").trim();
    
    if (!slug || !titleValue || !id || !releaseId) {
      console.warn(`[WARN] Tracks Row ${r + 1}: Missing required fields (id, slug, title, or release_id). Skipped.`);
      totalSkipped += 1;
      continue;
    }

    const { frontmatter, body } = buildTracksFrontmatterAndBody(rec);
    const filePath = path.join(TRACKS_DIR, `${slug}.mdx`);

    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    let finalBody = body;
    if (exists && (!body || body.trim() === "")) {
      // シート側にbody未入力なら既存本文を保持
      const currentBody = await readExistingBodyIfAny(filePath);
      if (currentBody) finalBody = currentBody;
    }

    const mdx = toMdx(frontmatter, finalBody);
    await fs.writeFile(filePath, mdx, "utf8");
    
    // リリースごとのトラック情報を収集
    if (!tracksByRelease.has(releaseId)) {
      tracksByRelease.set(releaseId, []);
    }
    tracksByRelease.get(releaseId).push(slug);
    
    if (exists) {
      console.log(`[UPDATE] Track: ${slug}.mdx`);
      totalUpdated += 1;
    } else {
      console.log(`[CREATE] Track: ${slug}.mdx`);
      totalCreated += 1;
    }
  }

  // Worksファイルにtracks情報を追加
  console.log("Linking tracks to works...");
  for (const [releaseId, trackSlugs] of tracksByRelease) {
    const workInfo = worksMap.get(releaseId);
    if (workInfo) {
      const workFilePath = path.join(WORKS_DIR, `${workInfo.slug}.mdx`);
      const updatedFrontmatter = { ...workInfo.frontmatter, tracks: trackSlugs };
      
      const currentBody = await readExistingBodyIfAny(workFilePath);
      const mdx = toMdx(updatedFrontmatter, currentBody);
      await fs.writeFile(workFilePath, mdx, "utf8");
      
      console.log(`[LINK] Added ${trackSlugs.length} tracks to ${workInfo.slug}.mdx`);
    } else {
      console.warn(`[WARN] Release ID ${releaseId} not found in Works sheet`);
    }
  }

  console.log(`Tracks processing done. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
}

async function main() {
  const serviceAccountJson = getEnv("GOOGLE_SERVICE_ACCOUNT", { required: true });
  const spreadsheetId = getEnv("GOOGLE_SHEETS_ID", { required: true });

  const sheets = createSheetsClientFromServiceAccountJson(serviceAccountJson);

  await ensureDir(WORKS_DIR);
  await ensureDir(TRACKS_DIR);

  // Worksシートを処理
  const worksMap = await processWorksSheet(sheets, spreadsheetId);
  
  // Tracksシートを処理し、Worksとリンク
  await processTracksSheet(sheets, spreadsheetId, worksMap);

  console.log("\nAll processing completed successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
