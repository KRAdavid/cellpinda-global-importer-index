import fs from "node:fs";

const schemaPath = new URL("../content/human-grade-schema.json", import.meta.url);
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const requiredColumns = new Set(schema.sheet?.requiredColumns ?? []);
const required = [
  "id",
  "status",
  "title_ko",
  "title_en",
  "summary_ko",
  "summary_en",
  "audiences",
  "category",
  "drive_file_id",
  "public_url",
  "updated_at",
];

for (const column of required) {
  if (!requiredColumns.has(column)) {
    throw new Error(`Missing required PUBLIC_INDEX column: ${column}`);
  }
}

const expectedAudiences = [
  "consumer",
  "distributor",
  "brand",
  "laboratory",
  "enterprise",
  "investor",
];

for (const audience of expectedAudiences) {
  if (!schema.sheet.audienceValues.includes(audience)) {
    throw new Error(`Missing audience value: ${audience}`);
  }
}

if (schema.sourceOfTruth.records !== "Google Sheets") {
  throw new Error("Google Sheets must remain the canonical metadata source.");
}

if (schema.sourceOfTruth.files !== "Google Drive") {
  throw new Error("Google Drive must remain the canonical file source.");
}

console.log("Human-grade metadata schema validated.");
