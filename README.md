# Cellpinda GABA Global Web Index

A responsive public B2B knowledge index for importers evaluating `Cellpinda GABA 100%`. The existing Google Drive folder remains the single source of truth for original files; GitHub stores the web application and generated public metadata only.

## Current implementation

- Next.js 16 + React + TypeScript static export
- Product, manufacturing, quality, evidence, regulatory, patent, case-study, market, document, update and search screens
- Client-side full-text search and filters
- Certificate expiry and Archive handling
- Qualified regulatory and evidence wording
- Daily Google Drive synchronization and automatic Pull Request workflow
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
  → validate and build
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

## Key files

- `apps-script/Code.gs` — public read-only Drive JSON feed
- `scripts/sync-public-feed.mjs` — feed validation, classification and index generation
- `.github/workflows/sync-drive-index.yml` — daily synchronization
- `public/data/index.json` — generated public document index
- `public/data/status.json` — generated data-quality status

## Local commands

```bash
npm install
npm run validate
npm run test:sync-rules
npm run dev
npm run build
```

Live feed test:

```bash
export GOOGLE_DRIVE_ROOT_FOLDER_ID=1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6
export GOOGLE_DRIVE_FEED_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
npm run sync:drive
```

The only required live-sync Repository variable is `GOOGLE_DRIVE_FEED_URL`. `OPENAI_API_KEY` remains optional.

See [SETUP_GUIDE_KO.md](./SETUP_GUIDE_KO.md), [apps-script/README_KO.md](./apps-script/README_KO.md), and [CONTENT_POLICY.md](./CONTENT_POLICY.md).
