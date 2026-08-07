#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("public/data/search-index.json");
const index = JSON.parse(await readFile(path, "utf8"));

const requiredFields = [
  "id",
  "title",
  "category",
  "subcategory",
  "country",
  "language",
  "summary",
  "tags",
  "sourceUrl",
  "downloadUrl",
  "lastUpdated",
  "status",
  "dashboardPath",
];

const qualifiedRegulatoryStatuses = new Set([
  "Official pathway identified",
  "Product-specific review required",
  "Local confirmation required",
  "Documentation incomplete",
  "Not yet reviewed",
]);

if (!index || !Array.isArray(index.documents)) {
  throw new Error("search-index.json must contain a documents array.");
}
if (!index.schemaVersion || !index.generatedAt) {
  throw new Error("search-index.json must contain schemaVersion and generatedAt.");
}
if (!["sample", "drive"].includes(index.sourceMode)) {
  throw new Error("search-index.json sourceMode must be sample or drive.");
}
if (index.documents.length === 0) {
  throw new Error("search-index.json must contain at least one document.");
}

const ids = new Set();
for (const [position, document] of index.documents.entries()) {
  for (const field of requiredFields) {
    if (!(field in document)) {
      throw new Error(`Document ${position} is missing required field: ${field}`);
    }
  }

  if (!document.id || ids.has(document.id)) {
    throw new Error(`Document ${position} has a missing or duplicate id: ${document.id}`);
  }
  ids.add(document.id);

  if (!Array.isArray(document.tags)) {
    throw new Error(`Document ${document.id} tags must be an array.`);
  }
  if (!String(document.dashboardPath).startsWith("/") || !String(document.dashboardPath).endsWith("/")) {
    throw new Error(`Document ${document.id} dashboardPath must start and end with /.`);
  }

  for (const field of ["sourceUrl", "downloadUrl"]) {
    const value = document[field];
    if (value !== null && (typeof value !== "string" || !value.startsWith("https://"))) {
      throw new Error(`Document ${document.id} ${field} must be null or an https URL.`);
    }
  }

  if (
    document.category === "Regulatory" &&
    !qualifiedRegulatoryStatuses.has(document.status)
  ) {
    throw new Error(
      `Regulatory document ${document.id} uses unsupported status: ${document.status}`,
    );
  }
}

console.log(
  `Guided AI validation passed: ${index.documents.length} records, ${ids.size} unique IDs.`,
);
