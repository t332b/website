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

function buildFrontmatterAndBody(record) {
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
  
  // カバー関連の外部URL配列
  const coverUrls = parseArrayField(cover_url_list);
  if (coverUrls.length > 0) fm.cover_url_list = coverUrls;
  
  const linksObj = parseJsonField(links);
  if (Object.keys(linksObj).length > 0) fm.links = linksObj;
  
  // デフォルトで空配列
  fm.tracks = [];

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

  await ensureDir(WORKS_DIR);

  // Worksシートを取得
  const range = "'Works'";
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = valuesRes.data.values || [];
  
  if (values.length === 0) {
    console.log("No data found in Works sheet.");
    return;
  }

  const headers = values[0].map(normalizeHeader);
  const slugIdx = headers.indexOf("slug");
  const titleIdx = headers.indexOf("title");
  const idIdx = headers.indexOf("id");
  
  if (slugIdx === -1 || titleIdx === -1 || idIdx === -1) {
    throw new Error("Works sheet is missing required columns: 'id', 'slug', and/or 'title'");
  }

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
      console.warn(`[WARN] Row ${r + 1}: Missing required fields (id, slug, or title). Skipped.`);
      totalSkipped += 1;
      continue;
    }

    const { frontmatter, body } = buildFrontmatterAndBody(rec);
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
    if (exists) {
      console.log(`[UPDATE] ${slug}.mdx`);
      totalUpdated += 1;
    } else {
      console.log(`[CREATE] ${slug}.mdx`);
      totalCreated += 1;
    }
  }

  console.log(`\nDone. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

