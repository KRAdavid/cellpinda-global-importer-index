#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const INDEX_PATH = resolve(ROOT, "public/data/index.json");
const STATUS_PATH = resolve(ROOT, "public/data/status.json");

const CATEGORY_BY_FOLDER = new Map([
  ["01_Product", "Product"],
  ["02_Manufacturing", "Manufacturing"],
  ["03_Quality_Certificates", "Quality Certificates"],
  ["04_Scientific_Evidence", "Scientific Evidence"],
  ["05_Regulatory", "Regulatory"],
  ["06_Patents", "Patents"],
  ["07_Case_Studies", "Case Studies"],
  ["08_Market_Insights", "Market Insights"],
  ["99_Archive", "Archive"],
]);

const CATEGORY_VALUES = [
  "Product",
  "Manufacturing",
  "Quality Certificates",
  "Scientific Evidence",
  "Regulatory",
  "Patents",
  "Case Studies",
  "Market Insights",
  "Archive",
];

const EVIDENCE_STATUSES = new Set([
  "Supportive",
  "Mixed",
  "Null",
  "Indirect",
  "Insufficient",
]);

const REGULATORY_STATUSES = new Set([
  "Official pathway identified",
  "Product-specific review required",
  "Local confirmation required",
  "Documentation incomplete",
  "Not yet reviewed",
]);

const LANGUAGE_PATTERNS = [
  { language: "Korean", tokens: ["ko", "kor", "korean", "kr"] },
  { language: "English", tokens: ["en", "eng", "english"] },
  { language: "Japanese", tokens: ["ja", "jpn", "japanese", "jp"] },
  { language: "Chinese", tokens: ["zh", "zho", "chi", "chinese", "cn"] },
  { language: "French", tokens: ["fr", "fra", "french"] },
  { language: "German", tokens: ["de", "deu", "german"] },
  { language: "Spanish", tokens: ["es", "spa", "spanish"] },
];

const MIME_SOURCE_TYPES = new Map([
  ["application/pdf", "PDF"],
  ["application/vnd.google-apps.document", "Google Doc"],
  ["application/vnd.google-apps.spreadsheet", "Google Sheet"],
  ["application/vnd.google-apps.presentation", "Google Slides"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word document"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Spreadsheet"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "Presentation"],
  ["text/plain", "Text document"],
  ["text/csv", "CSV"],
]);

function env(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function booleanEnv(name, fallback = false) {
  const value = env(name);
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function fetchPublicFeed(feedUrl, expectedRootFolderId) {
  let url;
  try {
    url = new URL(feedUrl);
  } catch {
    throw new Error("GOOGLE_DRIVE_FEED_URL must be a valid HTTPS Apps Script web-app URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("GOOGLE_DRIVE_FEED_URL must use HTTPS.");
  }
  url.searchParams.set("refresh", String(Date.now()));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "Cellpinda-Global-Index-Feed-Sync/1.0",
      },
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Apps Script feed returned HTTP ${response.status}: ${text.slice(0, 600)}`);
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Apps Script feed did not return JSON: ${text.slice(0, 300)}`);
    }
    if (payload.ok === false) {
      throw new Error(payload.error || "Apps Script feed reported an unknown error.");
    }
    if (!Array.isArray(payload.files)) {
      throw new Error("Apps Script feed payload must contain a files array.");
    }
    if (
      expectedRootFolderId &&
      payload.rootFolderId &&
      payload.rootFolderId !== expectedRootFolderId
    ) {
      throw new Error(
        `Feed root mismatch. Expected ${expectedRootFolderId}, received ${payload.rootFolderId}.`,
      );
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Apps Script feed request timed out after 120 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return output;
}

function normalizeMetadataKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseDescription(description) {
  if (!description?.trim()) return {};
  const trimmed = description.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return Object.fromEntries(
        Object.entries(JSON.parse(trimmed)).map(([key, value]) => [normalizeMetadataKey(key), value]),
      );
    } catch {
      // Fall through to line-based parsing.
    }
  }

  const metadata = {};
  for (const line of trimmed.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9 _-]{1,40})\s*:\s*(.+?)\s*$/);
    if (!match) continue;
    metadata[normalizeMetadataKey(match[1])] = match[2].trim();
  }
  return metadata;
}

function combinedMetadata(file) {
  const descriptionMetadata = parseDescription(file.description);
  const propertyMetadata = Object.fromEntries(
    Object.entries({ ...(file.properties || {}), ...(file.appProperties || {}) }).map(([key, value]) => [
      normalizeMetadataKey(key),
      value,
    ]),
  );
  return { ...descriptionMetadata, ...propertyMetadata };
}

function metadataValue(metadata, ...keys) {
  for (const key of keys) {
    const value = metadata[normalizeMetadataKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function parseBoolean(value) {
  return ["1", "true", "yes", "y", "on", "featured"].includes(String(value).trim().toLowerCase());
}

function parseTags(value) {
  if (Array.isArray(value)) return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
  return [...new Set(String(value || "").split(/[,;|]/).map((item) => item.trim()).filter(Boolean))];
}

function titleFromFilename(filename) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  return withoutExtension
    .replace(/^\d{4}[-_.]?\d{2}[-_.]?\d{2}[-_ ]*/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+-\s+/g, " — ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferVersion(filename) {
  const match = filename.match(/(?:^|[\s_.-])(?:v|ver|version)[\s_.-]?(\d+(?:\.\d+){0,3})(?:[\s_.-]|$)/i);
  return match ? `v${match[1]}` : "";
}

function inferDateFromText(text) {
  const separated = text.match(/(?:^|\D)(20\d{2})[-_.](0[1-9]|1[0-2])[-_.]([0-2]\d|3[01])(?:\D|$)/);
  if (separated) return `${separated[1]}-${separated[2]}-${separated[3]}`;
  const compact = text.match(/(?:^|\D)(20\d{2})(0[1-9]|1[0-2])([0-2]\d|3[01])(?:\D|$)/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return null;
}

function inferLanguage(text) {
  const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const entry of LANGUAGE_PATTERNS) {
    if (entry.tokens.some((token) => tokens.includes(token))) return entry.language;
  }
  return "";
}

function normalizeCountry(value) {
  const text = value.trim();
  const aliases = new Map([
    ["US", "USA"],
    ["United States", "USA"],
    ["United States of America", "USA"],
    ["European Union", "EU"],
    ["Korea", "Republic of Korea"],
    ["South Korea", "Republic of Korea"],
    ["ROK", "Republic of Korea"],
  ]);
  return aliases.get(text) || text;
}

function sourceType(file, metadata) {
  const explicit = metadataValue(metadata, "sourceType", "documentType");
  if (explicit) return explicit;
  if (MIME_SOURCE_TYPES.has(file.mimeType)) return MIME_SOURCE_TYPES.get(file.mimeType);
  const extension = file.name.split(".").pop()?.toUpperCase();
  return extension && extension !== file.name.toUpperCase() ? extension : "Public document";
}

function directDownloadUrl(file) {
  if (file.webContentLink) return file.webContentLink;
  const id = encodeURIComponent(file.id);
  if (file.mimeType === "application/vnd.google-apps.document") {
    return `https://docs.google.com/document/d/${id}/export?format=pdf`;
  }
  if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  }
  if (file.mimeType === "application/vnd.google-apps.presentation") {
    return `https://docs.google.com/presentation/d/${id}/export/pdf`;
  }
  if (file.mimeType === "application/vnd.google-apps.drawing") {
    return `https://docs.google.com/drawings/d/${id}/export/pdf`;
  }
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function driveViewUrl(file) {
  if (file.webViewLink) return file.webViewLink;
  return `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view`;
}

function inferCategory(path, metadata) {
  const explicit = metadataValue(metadata, "category");
  if (CATEGORY_VALUES.includes(explicit)) return explicit;
  const topFolder = path[0] || "";
  return CATEGORY_BY_FOLDER.get(topFolder) || "Archive";
}

function inferSubcategory(path, category, metadata) {
  const explicit = metadataValue(metadata, "subcategory", "topic");
  if (explicit) return explicit;
  if (["Scientific Evidence", "Regulatory"].includes(category) && path.length >= 3) return path[1];
  if (path.length >= 3) return path[1];
  return category;
}

function inferCountry(path, category, metadata) {
  const explicit = metadataValue(metadata, "country", "market", "region");
  if (explicit) return normalizeCountry(explicit);
  if (category === "Regulatory" && path.length >= 3) return normalizeCountry(path[1]);
  if (["Product", "Manufacturing", "Quality Certificates", "Patents"].includes(category)) {
    return "Republic of Korea";
  }
  return "Global";
}

function canonicalStatus(value, allowed) {
  const normalized = value.trim().toLowerCase();
  return allowed.find((candidate) => candidate.toLowerCase() === normalized) || "";
}

function inferStatus(category, metadata, expiryDate, topFolder) {
  const explicit = metadataValue(metadata, "status", "regulatoryStatus", "certificateStatus");
  if (topFolder === "99_Archive") return "Archived";
  if (expiryDate && expiryDate < todayDateOnly()) return "Expired";

  if (category === "Regulatory") {
    if (!explicit) return "Not yet reviewed";
    return canonicalStatus(explicit, [...REGULATORY_STATUSES]) || "Local confirmation required";
  }

  if (category === "Quality Certificates") {
    const allowed = [
      "Current",
      "Renewal required",
      "Expired",
      "Documentation incomplete",
      "Under review",
      "Superseded",
      "Archived",
    ];
    if (explicit) return canonicalStatus(explicit, allowed) || "Documentation incomplete";
    return expiryDate ? "Current" : "Documentation incomplete";
  }

  if (category === "Scientific Evidence") {
    const allowed = ["Reviewed", "Not reviewed", "Documentation incomplete", "Archived"];
    if (explicit) return canonicalStatus(explicit, allowed) || "Not reviewed";
    return "Not reviewed";
  }

  const genericAllowed = ["Current", "Under review", "Documentation incomplete", "Superseded", "Archived"];
  if (explicit) return canonicalStatus(explicit, genericAllowed) || "Under review";
  return "Current";
}

function inferLifecycle(metadata, status, expiryDate, topFolder) {
  const explicit = metadataValue(metadata, "currentOrArchive", "lifecycle");
  if (/archive/i.test(explicit)) return "Archive";
  if (/current/i.test(explicit)) return "Current";
  if (topFolder === "99_Archive") return "Archive";
  if (expiryDate && expiryDate < todayDateOnly()) return "Archive";
  if (/expired|renewal required|superseded|withdrawn|obsolete|archived/i.test(status)) return "Archive";
  return "Current";
}

function normalizeEvidenceStatus(value) {
  for (const candidate of EVIDENCE_STATUSES) {
    if (candidate.toLowerCase() === value.trim().toLowerCase()) return candidate;
  }
  return "Insufficient";
}

function buildRecord(file) {
  const metadata = combinedMetadata(file);
  const path = file.path;
  const topFolder = path[0] || "";
  const category = inferCategory(path, metadata);
  const subcategory = inferSubcategory(path, category, metadata);
  const filenameText = path.join(" ");
  const title = metadataValue(metadata, "title") || titleFromFilename(file.name) || file.name;
  const issueDate =
    dateOnly(metadataValue(metadata, "issueDate", "publicationDate", "date")) ||
    inferDateFromText(file.name) ||
    dateOnly(file.createdTime);
  const expiryDate = dateOnly(metadataValue(metadata, "expiryDate", "validUntil", "expirationDate"));
  const lastReviewed = dateOnly(metadataValue(metadata, "lastReviewed", "reviewDate")) || dateOnly(file.modifiedTime);
  const status = inferStatus(category, metadata, expiryDate, topFolder);
  const lifecycle = inferLifecycle(metadata, status, expiryDate, topFolder);
  const summaryFromMetadata = metadataValue(metadata, "summary", "abstract", "descriptionSummary");
  const tagsFromMetadata = parseTags(metadataValue(metadata, "tags", "keywords"));
  const inferredTags = [category, subcategory, inferCountry(path, category, metadata)].filter(Boolean);
  const tags = [...new Set([...tagsFromMetadata, ...inferredTags])];
  const language =
    metadataValue(metadata, "language") || inferLanguage(filenameText) || (category === "Regulatory" ? "English" : "English");
  const version = metadataValue(metadata, "version") || inferVersion(file.name) || "Not recorded";
  const summary =
    summaryFromMetadata ||
    `Public ${sourceType(file, metadata).toLowerCase()} indexed from Google Drive. Review the original source file for controlling details.`;

  const missingFields = [];
  if (!summaryFromMetadata) missingFields.push("summary");
  if (!metadataValue(metadata, "version") && !inferVersion(file.name)) missingFields.push("version");
  if (!metadataValue(metadata, "issueDate", "publicationDate", "date") && !inferDateFromText(file.name)) {
    missingFields.push("issueDate");
  }
  if (!metadataValue(metadata, "lastReviewed", "reviewDate")) missingFields.push("lastReviewed");
  if (!tagsFromMetadata.length) missingFields.push("tags");
  if (category === "Quality Certificates" && !expiryDate) missingFields.push("expiryDate");

  const record = {
    id: file.id,
    title,
    category,
    subcategory,
    country: inferCountry(path, category, metadata),
    language,
    version,
    issueDate,
    expiryDate,
    lastReviewed,
    sourceType: sourceType(file, metadata),
    driveUrl: driveViewUrl(file),
    downloadUrl: directDownloadUrl(file),
    summary,
    tags,
    status,
    currentOrArchive: lifecycle,
    modifiedTime: file.modifiedTime || file.createdTime || null,
    path,
    featured: parseBoolean(metadataValue(metadata, "featured", "popularDownload")),
    sample: false,
    mimeType: file.mimeType,
  };

  if (category === "Scientific Evidence") {
    const evidenceStatus = normalizeEvidenceStatus(metadataValue(metadata, "evidenceStatus"));
    record.research = {
      studyType: metadataValue(metadata, "studyType", "researchType") || "Not entered",
      population: metadataValue(metadata, "population", "studyPopulation") || "Not entered",
      sampleSize: metadataValue(metadata, "sampleSize", "n") || null,
      dose: metadataValue(metadata, "dose", "dosage") || "Not entered",
      duration: metadataValue(metadata, "duration", "studyDuration") || "Not entered",
      keyResults: metadataValue(metadata, "keyResults", "results") || "Not entered",
      limitations: metadataValue(metadata, "limitations", "studyLimitations") || "Not entered",
      evidenceStatus,
      pmid: metadataValue(metadata, "pmid") || null,
      doi: metadataValue(metadata, "doi") || null,
      cellpindaDirectness:
        metadataValue(metadata, "cellpindaDirectness", "directness") || "Not assessed",
    };
    for (const field of [
      ["studyType", "studyType"],
      ["population", "population"],
      ["dose", "dose"],
      ["duration", "duration"],
      ["keyResults", "keyResults"],
      ["limitations", "limitations"],
      ["evidenceStatus", "evidenceStatus"],
      ["cellpindaDirectness", "cellpindaDirectness"],
    ]) {
      if (!metadataValue(metadata, field[1])) missingFields.push(`research.${field[0]}`);
    }
  }

  if (category === "Regulatory" && !REGULATORY_STATUSES.has(status)) {
    missingFields.push("recognizedRegulatoryStatus");
  }

  return { record, missingFields: [...new Set(missingFields)] };
}

function extractResponseText(response) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

async function enrichWithOpenAI(records, warnings) {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) return { records, enabled: false, processed: 0, model: null };

  const model = env("OPENAI_MODEL", "gpt-5-mini");
  const maxDocuments = Math.max(0, Number(env("OPENAI_MAX_DOCUMENTS", "20")) || 20);
  let processed = 0;
  const enriched = [];

  for (const record of records) {
    if (processed >= maxDocuments) {
      enriched.push(record);
      continue;
    }
    const needsSummary = record.summary.startsWith("Public ") && record.summary.includes("indexed from Google Drive");
    const needsTags = record.tags.length <= 3;
    if (!needsSummary && !needsTags) {
      enriched.push(record);
      continue;
    }

    const source = {
      title: record.title,
      category: record.category,
      subcategory: record.subcategory,
      country: record.country,
      language: record.language,
      sourceType: record.sourceType,
      path: record.path,
      existingSummary: record.summary,
      existingTags: record.tags,
    };

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content:
                "You classify public B2B document metadata. Use only supplied metadata. Do not invent efficacy, regulatory approval, legal status, importability, study results, certificate validity, or product claims. Write a neutral one-sentence navigation summary. If metadata is insufficient, explicitly say what the document appears to cover without asserting conclusions.",
            },
            {
              role: "user",
              content: JSON.stringify(source),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "document_index_metadata",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  summary: { type: "string", minLength: 20, maxLength: 420 },
                  tags: {
                    type: "array",
                    minItems: 2,
                    maxItems: 10,
                    items: { type: "string", minLength: 1, maxLength: 50 },
                  },
                },
                required: ["summary", "tags"],
              },
            },
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || `HTTP ${response.status}`);
      const parsed = JSON.parse(extractResponseText(payload));
      enriched.push({
        ...record,
        summary: needsSummary ? parsed.summary : record.summary,
        tags: [...new Set([...record.tags, ...parseTags(parsed.tags)])].slice(0, 14),
      });
      processed += 1;
    } catch (error) {
      warnings.push(`AI metadata enrichment skipped for ${record.title}: ${error.message}`);
      enriched.push(record);
    }
  }

  return { records: enriched, enabled: true, processed, model };
}

async function checkOneLink(record) {
  const url = record.downloadUrl || record.driveUrl;
  if (!url) return { ok: false, reason: "Missing public URL", status: 0 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Cellpinda-Global-Index-Link-Check/1.0" },
    });
    if ([403, 405].includes(response.status)) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Cellpinda-Global-Index-Link-Check/1.0",
          range: "bytes=0-0",
        },
      });
    }
    const ok = response.status >= 200 && response.status < 400;
    return { ok, reason: ok ? "" : `HTTP ${response.status}`, status: response.status };
  } catch (error) {
    return { ok: false, reason: error.name === "AbortError" ? "Timeout" : error.message, status: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyLinks(records) {
  if (!booleanEnv("VERIFY_PUBLIC_LINKS", false)) {
    return {
      brokenLinks: [],
      linkChecks: { mode: "disabled", checked: 0, healthy: 0, broken: 0 },
    };
  }

  const results = await mapLimit(records, 5, async (record) => ({ record, ...(await checkOneLink(record)) }));
  const brokenLinks = results
    .filter((item) => !item.ok)
    .map((item) => ({
      id: item.record.id,
      title: item.record.title,
      url: item.record.downloadUrl || item.record.driveUrl,
      reason: item.reason,
    }));
  return {
    brokenLinks,
    linkChecks: {
      mode: "public-http-check",
      checked: results.length,
      healthy: results.length - brokenLinks.length,
      broken: brokenLinks.length,
    },
  };
}

function compareRecords(oldDocuments, newDocuments) {
  const oldById = new Map(oldDocuments.map((record) => [record.id, record]));
  const newById = new Map(newDocuments.map((record) => [record.id, record]));
  let added = 0;
  let modified = 0;
  let deleted = 0;

  for (const [id, record] of newById) {
    const previous = oldById.get(id);
    if (!previous) added += 1;
    else if (stableStringify(previous) !== stableStringify(record)) modified += 1;
  }
  for (const id of oldById.keys()) {
    if (!newById.has(id)) deleted += 1;
  }
  return { added, modified, deleted };
}

function compareDocuments(left, right) {
  const leftDate = left.modifiedTime || left.issueDate || "";
  const rightDate = right.modifiedTime || right.issueDate || "";
  return rightDate.localeCompare(leftDate) || left.title.localeCompare(right.title);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function statusComparable(status) {
  if (!status) return null;
  const { generatedAt, changeSummary, ...rest } = status;
  return rest;
}

async function main() {
  const rootFolderId = env("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  if (!rootFolderId) throw new Error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID.");
  const feedUrl = env("GOOGLE_DRIVE_FEED_URL");
  if (!feedUrl) {
    throw new Error(
      "Missing GOOGLE_DRIVE_FEED_URL. Deploy apps-script/Code.gs as a public web app and store its /exec URL as a GitHub repository variable.",
    );
  }

  const feed = await fetchPublicFeed(feedUrl, rootFolderId);
  const treeFiles = feed.files.filter((file) => file && file.id && !file.trashed);
  console.log(
    `Read ${treeFiles.length} public file record(s) from Apps Script feed ${feed.rootFolderName || rootFolderId}.`,
  );

  const publicFiles = treeFiles.filter((file) => file.public !== false);
  const privateFilesExcluded = Math.max(
    0,
    Number(feed.privateFilesExcluded || 0) + treeFiles.length - publicFiles.length,
  );
  console.log(`Public files: ${publicFiles.length}; private/non-public files excluded: ${privateFilesExcluded}.`);

  if (!publicFiles.length && !booleanEnv("ALLOW_EMPTY_INDEX", false)) {
    throw new Error(
      "No publicly shared files were found. To prevent an accidental empty deployment, the existing index was left unchanged. Share at least one file publicly or set ALLOW_EMPTY_INDEX=true intentionally.",
    );
  }

  const built = publicFiles.map(buildRecord);
  const warnings = Array.isArray(feed.warnings) ? feed.warnings.map(String) : [];
  const aiResult = await enrichWithOpenAI(
    built.map((item) => item.record),
    warnings,
  );
  const documents = aiResult.records.sort(compareDocuments);
  const missingMetadata = built
    .filter((item) => item.missingFields.length)
    .map((item) => ({
      id: item.record.id,
      title: item.record.title,
      fields: item.missingFields,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));

  const { brokenLinks, linkChecks } = await verifyLinks(documents);
  if (privateFilesExcluded) {
    warnings.push(`${privateFilesExcluded} private or non-public file(s) were excluded from the public web index.`);
  }
  if (missingMetadata.length) {
    warnings.push(`${missingMetadata.length} indexed record(s) use fallback metadata; update the Drive description to improve the public index.`);
  }
  if (brokenLinks.length) {
    warnings.push(`${brokenLinks.length} public link(s) failed the configured link check.`);
  }

  const oldIndex = await readJson(INDEX_PATH, { documents: [] });
  const oldStatus = await readJson(STATUS_PATH, null);
  const changeSummary = compareRecords(oldIndex.documents || [], documents);
  const generatedAt = nowIso();
  const sourceSnapshot = sha256(stableStringify(documents));
  const index = {
    schemaVersion: "1.0.0",
    generatedAt,
    sourceMode: "drive",
    sourceSnapshot,
    documents,
  };
  const currentCount = documents.filter((item) => item.currentOrArchive === "Current").length;
  const archiveCount = documents.length - currentCount;
  const healthy = documents.length > 0 && brokenLinks.length === 0;
  const status = {
    schemaVersion: "1.0.0",
    generatedAt,
    sourceMode: "drive",
    healthy,
    documentCount: documents.length,
    currentCount,
    archiveCount,
    publicFilesIndexed: documents.length,
    privateFilesExcluded,
    missingMetadata,
    brokenLinks,
    linkChecks,
    aiClassification: {
      enabled: aiResult.enabled,
      processed: aiResult.processed,
      model: aiResult.model,
    },
    changeSummary,
    warnings,
    requiredAction: brokenLinks.length
      ? "Review broken public links in Google Drive, then run the sync workflow again."
      : null,
  };

  const documentsChanged = oldIndex.sourceSnapshot !== sourceSnapshot;
  const statusChanged =
    stableStringify(statusComparable(oldStatus)) !== stableStringify(statusComparable(status));
  if (!documentsChanged && !statusChanged) {
    console.log("No public Drive feed index or status changes detected; generated files were left untouched.");
    return;
  }

  await Promise.all([
    writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`, "utf8"),
    writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, "utf8"),
  ]);

  console.log(
    `Wrote public index: ${documents.length} records (${changeSummary.added} added, ${changeSummary.modified} modified, ${changeSummary.deleted} deleted).`,
  );
}

function runSelfTest() {
  const baseFile = {
    id: "fixture-file",
    name: "2026-08-01_Cellpinda_GABA_Product_Specification_v3_EN.pdf",
    mimeType: "application/pdf",
    modifiedTime: "2026-08-05T00:00:00.000Z",
    createdTime: "2026-08-01T00:00:00.000Z",
    description: "",
    appProperties: {},
    properties: {},
    webViewLink: "https://drive.google.com/file/d/fixture-file/view",
    webContentLink: "https://drive.google.com/uc?id=fixture-file",
    path: [
      "01_Product",
      "2026-08-01_Cellpinda_GABA_Product_Specification_v3_EN.pdf",
    ],
  };

  const product = buildRecord(baseFile).record;
  if (product.category !== "Product" || product.version !== "v3") {
    throw new Error("Self-test failed: product folder/version classification.");
  }
  if (product.language !== "English" || product.country !== "Republic of Korea") {
    throw new Error("Self-test failed: language/country inference.");
  }

  const expired = buildRecord({
    ...baseFile,
    id: "fixture-expired",
    name: "FSSC_Certificate_EN.pdf",
    path: ["03_Quality_Certificates", "FSSC_Certificate_EN.pdf"],
    description: "expiryDate: 2000-01-01\nstatus: Current",
  }).record;
  if (expired.status !== "Expired" || expired.currentOrArchive !== "Archive") {
    throw new Error("Self-test failed: expired certificates must be archived.");
  }

  const regulatory = buildRecord({
    ...baseFile,
    id: "fixture-regulatory",
    name: "USA_Regulatory_Review_EN.pdf",
    path: ["05_Regulatory", "USA", "USA_Regulatory_Review_EN.pdf"],
    description: "status: Approved for import",
  }).record;
  if (regulatory.status !== "Local confirmation required") {
    throw new Error("Self-test failed: unsupported regulatory status was not qualified.");
  }

  const evidence = buildRecord({
    ...baseFile,
    id: "fixture-evidence",
    name: "GABA_Sleep_RCT_EN.pdf",
    path: ["04_Scientific_Evidence", "Sleep", "GABA_Sleep_RCT_EN.pdf"],
    description: [
      "studyType: Randomized controlled trial",
      "population: Adults",
      "sampleSize: 120",
      "dose: 100 mg/day",
      "duration: 4 weeks",
      "keyResults: Result recorded in source",
      "limitations: Short duration",
      "evidenceStatus: Supportive",
      "cellpindaDirectness: Comparable GABA evidence",
    ].join("\n"),
  }).record;
  if (evidence.research?.evidenceStatus !== "Supportive" || evidence.subcategory !== "Sleep") {
    throw new Error("Self-test failed: evidence metadata classification.");
  }

  console.log("Public feed sync rule self-test passed: folder mapping, expiry archive, regulatory qualification and evidence metadata.");
}

if (process.argv.includes("--self-test")) {
  try {
    runSelfTest();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
} else {
  main().catch((error) => {
    console.error(`Public Drive feed sync failed: ${error.message}`);
    process.exit(1);
  });
}
