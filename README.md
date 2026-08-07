# Cellpinda GABA Global Web Index

A responsive public B2B knowledge index for importers evaluating `Cellpinda GABA 100%`. The existing Google Drive folder remains the single source of truth for original files; GitHub stores the web application and generated public metadata only.

## Current implementation

- Next.js 16 + React + TypeScript static export
- Product, manufacturing, quality, evidence, regulatory, patent, case-study, market, document, update and search screens
- Ask Cellpinda Guided AI v1 with two-to-three-step guided flows and a persistent free-question field
- Country, language, product type, topic, subtopic and previous-selection context stored for the current browser session
- Evidence-grounded local answer generation from `public/data/search-index.json`
- Direct links between Guided AI answers and the existing dashboard sections
- Client-side full-text search and filters
- Certificate expiry and Archive handling
- Qualified regulatory and evidence wording
- Daily Google Drive synchronization and automatic Pull Request workflow
- Desktop and mobile Playwright interaction tests
- Vercel or Cloudflare Pages compatible `out/` output
- No database and no Google Cloud Console setup required

## Architecture

```text
Existing Cellpinda Global Data Room
             │
             │ Apps Script built-in DriveApp (read-only)
             ▼
Public Apps Script JSON web app
             │
             │ HTTPS GET
             ▼
GitHub Actions
  → classify folder, filename and Drive description
  → generate index.json and status.json
  → generate search-index.json for Ask Cellpinda
  → validate Guided AI data and flows
  → build and test the static site
  → create or update an automation Pull Request
             │
             ▼
Next.js static export → Vercel or Cloudflare Pages
```

Apps Script uses its default project and built-in Drive service. No user-managed Cloud Console project, API key or service-account private key is required.

## Existing Drive source

```text
Folder: Cellpinda Global Data Room
ID: 1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6
Access: Anyone with the link → Viewer
```

Only this public root is indexed. Personal Drive files and the separate internal/NDA Data Room are outside the configured root.

## Ask Cellpinda data contract

`public/data/search-index.json` is generated from `public/data/index.json`. Each record supports at least:

```text
id, title, category, subcategory, country, language, summary, tags,
sourceUrl, downloadUrl, lastUpdated, status, dashboardPath
```

The UI reads this generated contract only. When Google Drive synchronization replaces the source index, the Guided AI interface does not need to be rewritten.

Guided AI v1 is intentionally grounded in indexed metadata. Free-text questions use local category inference and document ranking; no hosted language-model API or runtime secret is required. A future server-side AI layer can consume the same search index while retaining the current evidence and regulatory guardrails.

## Key files

- `app/ask-cellpinda/page.tsx` — standalone Guided AI route
- `components/AskCellpinda.tsx` — guided flow, context and answer UI
- `lib/guided-ai.ts` — flow definitions, routing, ranking and safe answer generation
- `scripts/build-search-index.mjs` — generated Guided AI data contract
- `scripts/validate-guided-ai.mjs` — schema and regulatory-status validation
- `scripts/test-guided-ai.mjs` — guided-flow, free-question, country and language tests
- `tests/guided-ai.spec.ts` — desktop/mobile browser tests and route checks
- `apps-script/Code.gs` — public read-only Drive JSON feed
- `scripts/sync-public-feed.mjs` — feed validation, classification and source-index generation
- `.github/workflows/sync-drive-index.yml` — daily synchronization
- `public/data/index.json` — generated public document index
- `public/data/search-index.json` — generated Guided AI search index
- `public/data/status.json` — generated data-quality status

## Local commands

```bash
npm install
npm run validate
npm run test:sync-rules
npm run build
npx playwright install chromium
npm run test:e2e
```

Live feed test:

```bash
export GOOGLE_DRIVE_ROOT_FOLDER_ID=1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6
export GOOGLE_DRIVE_FEED_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
npm run sync:drive
npm run build
```

The only required live-sync Repository variable is `GOOGLE_DRIVE_FEED_URL`. `OPENAI_API_KEY` remains optional for metadata enrichment and is not required by Guided AI v1.

See [SETUP_GUIDE_KO.md](./SETUP_GUIDE_KO.md), [apps-script/README_KO.md](./apps-script/README_KO.md), and [CONTENT_POLICY.md](./CONTENT_POLICY.md).
