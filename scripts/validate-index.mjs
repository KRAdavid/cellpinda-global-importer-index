#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const indexPath = resolve(root, "public/data/index.json");
const statusPath = resolve(root, "public/data/status.json");
const contentPath = resolve(root, "content/site-content.json");

const evidenceStatuses = new Set([
  "Supportive",
  "Mixed",
  "Null",
  "Indirect",
  "Insufficient",
]);
const lifecycleValues = new Set(["Current", "Archive"]);
const requiredDocumentFields = [
  "id",
  "title",
  "category",
  "subcategory",
  "country",
  "language",
  "version",
  "issueDate",
  "expiryDate",
  "lastReviewed",
  "sourceType",
  "driveUrl",
  "downloadUrl",
  "summary",
  "tags",
  "status",
  "currentOrArchive",
];

function isDateOrNull(value) {
  return value === null || (typeof value === "string" && !Number.isNaN(Date.parse(value)));
}

function isUrlOrNull(value) {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const [index, status, content] = await Promise.all([
  readJson(indexPath),
  readJson(statusPath),
  readJson(contentPath),
]);

const errors = [];
const warnings = [];
const ids = new Set();

if (!Array.isArray(index.documents)) {
  errors.push("public/data/index.json: documents must be an array.");
} else {
  for (const [position, document] of index.documents.entries()) {
    const prefix = `documents[${position}]`;
    for (const field of requiredDocumentFields) {
      if (!(field in document)) errors.push(`${prefix}: missing field ${field}.`);
    }

    if (typeof document.id !== "string" || !document.id.trim()) {
      errors.push(`${prefix}: id must be a non-empty string.`);
    } else if (ids.has(document.id)) {
      errors.push(`${prefix}: duplicate id ${document.id}.`);
    } else {
      ids.add(document.id);
    }

    for (const field of ["title", "category", "subcategory", "country", "language", "sourceType", "summary", "status"]) {
      if (typeof document[field] !== "string" || !document[field].trim()) {
        errors.push(`${prefix}: ${field} must be a non-empty string.`);
      }
    }

    if (typeof document.version !== "string") {
      errors.push(`${prefix}: version must be a string.`);
    }
    if (!Array.isArray(document.tags) || document.tags.some((tag) => typeof tag !== "string")) {
      errors.push(`${prefix}: tags must be an array of strings.`);
    }
    if (!lifecycleValues.has(document.currentOrArchive)) {
      errors.push(`${prefix}: currentOrArchive must be Current or Archive.`);
    }

    for (const field of ["issueDate", "expiryDate", "lastReviewed", "modifiedTime"]) {
      if (field in document && !isDateOrNull(document[field])) {
        errors.push(`${prefix}: ${field} must be an ISO-compatible date or null.`);
      }
    }
    for (const field of ["driveUrl", "downloadUrl"]) {
      if (!isUrlOrNull(document[field])) errors.push(`${prefix}: ${field} must be a URL or null.`);
    }

    if (document.sample && (document.driveUrl || document.downloadUrl)) {
      errors.push(`${prefix}: sample records must not expose live source links.`);
    }

    if (document.expiryDate && Date.parse(document.expiryDate) < Date.now() && document.currentOrArchive !== "Archive") {
      errors.push(`${prefix}: expired records must be classified as Archive.`);
    }

    if (document.research) {
      const research = document.research;
      if (!evidenceStatuses.has(research.evidenceStatus)) {
        errors.push(`${prefix}: invalid research evidenceStatus ${research.evidenceStatus}.`);
      }
      for (const field of ["studyType", "population", "dose", "duration", "keyResults", "limitations", "cellpindaDirectness"]) {
        if (typeof research[field] !== "string") {
          errors.push(`${prefix}: research.${field} must be a string.`);
        }
      }
    }
  }
}

if (status.documentCount !== index.documents.length) {
  errors.push(`status.documentCount (${status.documentCount}) does not match index count (${index.documents.length}).`);
}
const currentCount = index.documents.filter((item) => item.currentOrArchive === "Current").length;
const archiveCount = index.documents.filter((item) => item.currentOrArchive === "Archive").length;
if (status.currentCount !== currentCount) errors.push("status.currentCount is inconsistent with the index.");
if (status.archiveCount !== archiveCount) errors.push("status.archiveCount is inconsistent with the index.");

const expectedSlugs = [
  "product-overview",
  "manufacturing-quality",
  "scientific-evidence",
  "global-regulatory-index",
  "patents",
  "case-studies",
  "market-insights",
  "document-center",
  "latest-updates",
  "global-search",
];
const actualSlugs = new Set(content.navigation?.map((item) => item.slug));
for (const slug of expectedSlugs) {
  if (!actualSlugs.has(slug)) errors.push(`site-content navigation is missing ${slug}.`);
  if (!content.sections?.[slug]) errors.push(`site-content sections is missing ${slug}.`);
}
if (!content.sections?.["system-status"]) errors.push("site-content sections is missing system-status.");

if (index.sourceMode === "sample") {
  warnings.push("Index is in explicit sample mode; live Drive links are intentionally disabled.");
}
if (status.missingMetadata?.length) {
  warnings.push(`${status.missingMetadata.length} record(s) are listed with incomplete metadata.`);
}

if (errors.length) {
  console.error(`Index validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Index validation passed: ${index.documents.length} records, ${currentCount} current, ${archiveCount} archive.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
