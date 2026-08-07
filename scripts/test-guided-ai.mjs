#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("lib/guided-ai.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
  reportDiagnostics: true,
});

const diagnostics = compiled.diagnostics ?? [];
if (diagnostics.length > 0) {
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  });
  throw new Error(formatted);
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
const engine = await import(moduleUrl);
const index = JSON.parse(await readFile("public/data/search-index.json", "utf8"));

const qualifiedStatuses = new Set([
  "Official pathway identified",
  "Product-specific review required",
  "Local confirmation required",
  "Documentation incomplete",
  "Not yet reviewed",
]);

for (const category of ["product", "quality", "research", "regulation", "import", "cases"]) {
  const steps = engine.getGuidedSteps(category);
  assert.ok(steps.length >= 2 && steps.length <= 3, `${category} must have two or three guided steps`);
  assert.ok(steps.every((step) => step.choices.length > 0), `${category} steps must have choices`);
}

const canadaContext = {
  country: "Canada",
  language: "English",
  productType: "Dietary supplement",
  topic: "",
  subTopic: "Complete importer package",
  previousSelections: [],
};

const importAnswer = engine.buildGuidedAnswer(
  index,
  "import",
  canadaContext,
  "What documents do I need?",
);
assert.equal(importAnswer.category, "import");
assert.equal(importAnswer.question, "What documents do I need?");
assert.ok(qualifiedStatuses.has(importAnswer.status), "Importer answer must use a qualified regulatory status");
assert.ok(
  importAnswer.documents.some((document) => document.country === "Canada"),
  "Canada context must prioritize a Canada record",
);
assert.ok(importAnswer.nextCategories.length >= 3, "Every answer must provide next exploration choices");

const koreanAnswer = engine.buildGuidedAnswer(index, "research", {
  ...canadaContext,
  country: "Global",
  language: "Korean",
  topic: "Human clinical trials",
  subTopic: "Sleep",
});
assert.match(koreanAnswer.answer, /연구자료|일반 GABA 연구/);
assert.ok(
  koreanAnswer.keyPoints.some((point) => point.includes("검색 조건")),
  "Language context must localize the answer structure",
);

const inferredQuestions = [
  ["What documents do I need?", "import"],
  ["Show FSSC and HACCP certificates", "quality"],
  ["Human clinical sleep papers", "research"],
  ["Canada claims and label rules", "regulation"],
  ["Feed application case studies", "cases"],
  ["Product specification and manufacturing", "product"],
];
for (const [question, expected] of inferredQuestions) {
  assert.equal(engine.inferCategoryFromQuestion(question), expected, `Question routing failed: ${question}`);
}

console.log(
  `Guided AI flow tests passed: 6 categories, ${index.documents.length} indexed records, country and language context verified.`,
);
