# Cellpinda GABA Global Web Index

A responsive, public B2B knowledge index for importers evaluating **Cellpinda GABA 100%**. Google Drive remains the source of truth for original files; this repository stores the web application and the generated public metadata index.

## Current MVP status

- Next.js + TypeScript static-export application
- Home dashboard and ten requested knowledge-index screens
- Full-text client-side search and filters for category, country, lifecycle and evidence status
- Explicit certificate, evidence and regulatory qualification controls
- Sample JSON records with disabled links until Drive is connected
- Daily Google Drive synchronization workflow
- Public-file-only permission check
- Automatic expiry-to-Archive handling
- Optional OpenAI metadata assistance, disabled when no API key exists
- Validation, static build and automated synchronization Pull Request workflow
- Vercel and Cloudflare Pages compatible `out/` export

## Architecture

```text
Google Drive: Cellpinda Global Data Room
             │
             │ Drive API (read-only service account)
             ▼
GitHub Actions: Sync Google Drive Index
  1. recursively list files
  2. retain only publicly shared files
  3. classify by folder / filename / optional Drive description
  4. archive expired records
  5. optionally enrich metadata with OpenAI
  6. generate public/data/index.json and status.json
  7. validate and build
  8. open or update an automation Pull Request
             │
             ▼
Next.js static export → out/ → Vercel or Cloudflare Pages
```

The synchronization workflow never uploads Drive originals to GitHub. The public site exposes metadata and public Drive links only.

## Information architecture

| Route | Purpose |
|---|---|
| `/` | Home Dashboard |
| `/product-overview/` | Product identity and specifications |
| `/manufacturing-quality/` | Manufacturing process and quality certificates |
| `/scientific-evidence/` | Structured evidence records |
| `/global-regulatory-index/` | Country and region pathway tracking |
| `/patents/` | Patent index |
| `/case-studies/` | Commercial and application examples |
| `/market-insights/` | Market intelligence |
| `/document-center/` | Complete filtered public document set |
| `/latest-updates/` | Recently added or modified records |
| `/global-search/` | Global metadata search |
| `/system-status/` | Missing metadata, excluded files and link status |

## Source-controlled content

- `content/site-content.json` — website copy, product facts, certificate summaries and controlled status definitions
- `public/data/index.json` — generated public document index
- `public/data/status.json` — generated automation and data-quality report

Website copy and data are intentionally separated from components.

## Local commands

```bash
npm install
npm run validate
npm run test:sync-rules
npm run dev
npm run build
```

`npm run build` creates the static site in `out/`.

To test Drive synchronization locally, configure `.env` values based on `.env.example`, export them in the shell, then run:

```bash
npm run sync:drive
```

Do not commit a service-account key or API key.

## Required repository configuration

Follow [SETUP_GUIDE_KO.md](./SETUP_GUIDE_KO.md) in order. The minimum live-sync configuration is:

- `GOOGLE_DRIVE_ROOT_FOLDER_ID` repository secret
- `GOOGLE_SERVICE_ACCOUNT_JSON` repository secret
- Google Drive API enabled for the service account project
- root Drive folder shared with the service account as Viewer
- source documents shared publicly as Viewer
- GitHub Actions permitted to create Pull Requests

`OPENAI_API_KEY` is optional. Folder and filename rules remain fully operational without it.

## Safety and content controls

This site is a document-discovery and importer qualification tool. Inclusion in the index does **not** establish regulatory approval, permitted use, efficacy, claim authorization or importability. See [CONTENT_POLICY.md](./CONTENT_POLICY.md).

## Project guides

- [SETUP_GUIDE_KO.md](./SETUP_GUIDE_KO.md) — 초보 사용자용 연결 순서
- [DRIVE_STRUCTURE.md](./DRIVE_STRUCTURE.md) — Drive 폴더·파일명·메타데이터 규칙
- [CONTENT_POLICY.md](./CONTENT_POLICY.md) — 공개 범위와 표현 원칙
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel / Cloudflare Pages 배포
