# Project Dashboard

Application source for the personal Obsidian progress dashboard. Canonical task data and design documents remain in the private Obsidian repository.

## Main and hosting

`pon-user/project-dashboard` main is the implementation source. Build the exact main checkout using the Sites build helper and mirror that commit to the bound private Sites source repository before deployment. Keep the deployed audience owner-only. CI checks main; deploying subsequent code changes currently requires the authenticated Sites publishing workflow.

## Private data synchronization

Install `integrations/vault-sync.yml` as `.github/workflows/dashboard-sync.yml` in the private vault. It runs on relevant main pushes, validates Markdown and sends derived JSON over TLS to the private Site. No task data, artifact, GitHub token or source Markdown is uploaded to this public repository.

Vault Actions settings: `DASHBOARD_URL` variable, `DASHBOARD_SITE_ACCESS` and `DASHBOARD_SYNC_KEY` secrets. The server stores `SYNC_WRITE_KEY` as a runtime secret. D1 holds the latest validated snapshot and failure state. The browser polls every 15 seconds. Invalid updates retain the previous successful payload; unavailable source or failed delivery is displayed with last known success. Failure to contact the server cannot immediately update its status; the last successful timestamp remains visible.

## Development

`npm ci`, `node --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run build`.

Synthetic tests only are committed. Actual private data tests are run outside this repository. Use `node scripts/convert.mjs <vault> <private-output.json>` for manual conversion. Never commit that output.

## Current document audit registry

The converter also reads `*差分監査レジストリ.json` files with schema `novel-audit-1`. A registry replaces the historical document snapshot for its project, keeps every file's audit task ID and full blob SHA, and displays its baseline commit separately from the synchronized task snapshot commit. An inherited completed review must match the file's SHA. Registry entries do not complete their audit tasks. Newly added files require a regenerated registry before claiming current document coverage.

Only synthetic fixtures belong in this repository. The private registry and conversion output remain in the vault or a private temporary directory. The converter hashes source ledger files and refuses a dirty tracked checkout when reporting a source commit.
