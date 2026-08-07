#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve("public/data/index.json");
const outputPath = resolve("public/data/search-index.json");

const dashboardPathByCategory = {
  Product: "/product-overview/",
  Manufacturing: "/manufacturing-quality/",
  "Quality Certificates": "/manufacturing-quality/",
  "Scientific Evidence": "/scientific-evidence/",
  Regulatory: "/global-regulatory-index/",
  Patents: "/patents/",
  "Case Studies": "/case-studies/",
  "Market Insights": "/market-insights/",
};

const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!source || !Array.isArray(source.documents)) {
  throw new Error("public/data/index.json must contain a documents array.");
}

const documents = source.documents.map((document) => ({
  id: String(document.id),
  title: String(document.title ?? "Untitled document"),
  category: String(document.category ?? "Documents"),
  subcategory: String(document.subcategory ?? "General"),
  country: String(document.country ?? "Global"),
  language: String(document.language ?? "English"),
  summary: String(document.summary ?? "No public summary is available."),
  tags: Array.isArray(document.tags) ? document.tags.map(String) : [],
  sourceUrl: document.driveUrl ?? document.sourceUrl ?? null,
  downloadUrl: document.downloadUrl ?? null,
  lastUpdated:
    document.modifiedTime ??
    document.lastReviewed ??
    document.issueDate ??
    source.generatedAt ??
    null,
  status: String(document.status ?? "Documentation incomplete"),
  dashboardPath:
    dashboardPathByCategory[document.category] ?? "/document-center/",
  sourceType: document.sourceType ? String(document.sourceType) : undefined,
  currentOrArchive: document.currentOrArchive ?? "Current",
  sample: Boolean(document.sample),
  featured: Boolean(document.featured),
  research: document.research ?? undefined,
}));

const searchIndex = {
  schemaVersion: "1.0.0",
  generatedAt: source.generatedAt ?? new Date().toISOString(),
  sourceMode: source.sourceMode ?? "sample",
  documents,
};

await writeFile(outputPath, `${JSON.stringify(searchIndex, null, 2)}\n`, "utf8");
console.log(`Guided AI search index generated: ${documents.length} records.`);
