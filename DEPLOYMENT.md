# Deployment Guide

The application uses Next.js static export. A successful build creates deployable HTML, CSS, JavaScript and JSON assets in `out/`. No runtime database or application server is required for the MVP.

## Pre-deployment gate

Run or confirm the following GitHub Actions checks first:

```bash
npm run validate
npm run build
```

The deployment is ready only when:

- `out/index.html` exists
- `out/data/index.json` exists
- `out/data/status.json` exists
- required section pages exist under `out/<route>/index.html`
- no private source file is present in generated JSON
- sample mode is understood or replaced by a live Drive sync

## Option A — Vercel

1. Sign in to Vercel and import `KRAdavid/cellpinda-global-importer-index`.
2. Select the repository root.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: `out`.
6. Node.js version: 24.
7. Deploy the `main` branch.

The public site does not need Google credentials. The public Apps Script `/exec` URL is stored as the GitHub Repository variable `GOOGLE_DRIVE_FEED_URL`; an optional `OPENAI_API_KEY` remains a GitHub Secret.

Recommended controls:

- Production branch: `main`
- Pull Request preview deployments: enabled
- Automatic production deployment after merge: enabled
- Deployment protection for non-production previews: optional

## Option B — Cloudflare Pages

1. Create a Pages project from the GitHub repository.
2. Production branch: `main`.
3. Framework preset: Next.js (Static HTML Export) or None.
4. Build command: `npm run build`.
5. Build output directory: `out`.
6. Node.js version environment: `NODE_VERSION=24`.
7. Save and deploy.

No Worker runtime is required for the MVP because all routes are statically generated.

## Deployment sequence

```text
Drive file added or changed
→ public Apps Script JSON feed reflects the Drive state
→ scheduled/manual Sync Google Drive Index action
→ generated JSON changes
→ automation Pull Request
→ validation + production build
→ merge to main
→ hosting platform detects main update
→ public site redeploys
```

With `AUTO_MERGE_DRIVE_INDEX=true`, the merge can be automated after the synchronization workflow completes its own validation and build. Without that variable, a human reviews and merges the Pull Request.

## Custom domain

After the first successful deployment:

1. Add the intended domain in the hosting dashboard.
2. Apply the DNS records supplied by the provider.
3. Wait for TLS issuance.
4. Confirm both the apex and `www` behavior.
5. Update any canonical-site metadata only after the final public domain is known.

## Responsive verification

Before production approval, inspect at minimum:

- Mobile: 390 × 844
- Tablet: 768 × 1024
- Desktop: 1440 × 1000

Check:

- sticky header and mobile navigation
- hero search field
- category navigation
- document filters and long titles
- evidence metadata rows
- regulatory status cards
- certificate lifecycle labels
- no horizontal overflow
- keyboard focus and link states

## Production launch checklist

- [ ] Replace the temporary importer-contact URL in `content/site-content.json`
- [ ] Deploy the Apps Script feed and register `GOOGLE_DRIVE_FEED_URL`
- [ ] Run a live Drive synchronization
- [ ] Confirm sample records are no longer the only records
- [ ] Confirm public files open in a private browser window
- [ ] Confirm renewal-required certificates are not presented as Current
- [ ] Confirm regulatory pages use qualified wording
- [ ] Confirm all required legal and privacy notices for the chosen domain
- [ ] Confirm mobile, tablet and desktop rendering
- [ ] Confirm deployment rollback is available

## Rollback

Because data updates are Pull Requests, rollback is straightforward:

1. Revert the problematic merge commit in GitHub.
2. Allow the hosting provider to redeploy the restored `main` state.
3. Correct the source file or metadata in Google Drive.
4. Run synchronization again.

Do not permanently patch generated JSON by hand; the next synchronization would overwrite it.

## Common deployment failures

| Failure | Resolution |
|---|---|
| `out/` missing | Confirm `next.config.ts` has `output: "export"` and `npm run build` succeeded |
| Node version error | Set Node.js 24 in the host settings |
| JSON data missing | Confirm `public/data/*.json` is committed and present in the build artifact |
| Route 404 | Confirm trailing-slash/static output settings and deploy the entire `out/` directory |
| Stale site after Drive update | Check the Apps Script feed, synchronization PR and hosting redeployment |
| Feed configuration missing | Register the Apps Script `/exec` URL as the `GOOGLE_DRIVE_FEED_URL` Repository variable |
| Private file exposed | Move it outside the public Data Room, run sync, merge the removal PR and review access logs |
