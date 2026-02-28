#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import yaml from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
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

function buildFrontmatterAndBody(record) {
  const {
    title = "",
    duration = "",
    lyrics_by = "",
    music_by = "",
    body = "",
    "links.spotify": links_spotify = "",
    "links.apple": links_apple = "",
    "links.bandcamp": links_bandcamp = "",
    "links.youtube": links_youtube = "",
    "links.soundcloud": links_soundcloud = "",
    "links.music_video": links_music_video = "",
  } = record;

  const links = {};
  if (links_spotify) links.spotify = links_spotify;
  if (links_apple) links.apple = links_apple;
  if (links_bandcamp) links.bandcamp = links_bandcamp;
  if (links_youtube) links.youtube = links_youtube;
  if (links_soundcloud) links.soundcloud = links_soundcloud;
  if (links_music_video) links.music_video = links_music_video;

  const fm = {};
  if (title) fm.title = title;
  if (duration) fm.duration = duration;
  if (lyrics_by) fm.lyrics_by = lyrics_by;
  if (music_by) fm.music_by = music_by;
  if (Object.keys(links).length > 0) fm.links = links;

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

async function main() {
  const serviceAccountJson = getEnv("GOOGLE_SERVICE_ACCOUNT", { required: true });
  const spreadsheetId = getEnv("GOOGLE_SHEETS_ID", { required: true });

  const sheets = createSheetsClientFromServiceAccountJson(serviceAccountJson);

  await ensureDir(TRACKS_DIR);

  // 1) まずシート一覧を取得
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitles = (metaRes.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter(Boolean);

  let totalUpdated = 0;
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const title of sheetTitles) {
    const range = `'${title}'`;
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values = valuesRes.data.values || [];
    if (values.length === 0) continue;

    const headers = values[0].map(normalizeHeader);
    const slugIdx = headers.indexOf("slug");
    const titleIdx = headers.indexOf("title");
    if (slugIdx === -1 || titleIdx === -1) {
      console.warn(`[WARN] Sheet '${title}' is missing required columns 'slug' and/or 'title'. Skipped.`);
      totalSkipped += Math.max(0, values.length - 1);
      continue;
    }

    for (let r = 1; r < values.length; r += 1) {
      const row = values[r];
      const rec = rowToObject(headers, row);
      const slug = (rec.slug || "").trim();
      const titleValue = (rec.title || "").trim();
      if (!slug || !titleValue) {
        totalSkipped += 1;
        continue;
      }

      const { frontmatter, body } = buildFrontmatterAndBody(rec);
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
      if (exists) totalUpdated += 1; else totalCreated += 1;
    }
  }

  console.log(`Done. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


