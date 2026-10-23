# Ring Guardian — Package Evidence and Recovery

**Amazon 2026 primary track for this RingGuardian repository:** Alexa+ **simulated experience alternative** (working demonstration must still be independently verified and recorded before entry). The Ring developer integration is supplemental and not currently verified as Ring-track eligible. This does not affect the separate Package P.I. / AmazonHackathon entry.

**Fast submission runbook:** [Alexa+ simulated experience minimum eligibility checklist](docs/HACKATHON-QUICK-SUBMISSION.md). The on-page interactive simulated package assistant uses record-backed tools, contextual conversational guidance, linked shipment profiles, and optional browser narration. It is not an authenticated Echo device or live Ring integration.

Ring Guardian demonstrates package-specific simulated doorbell views, same-address scene continuity, an eight-second delivery clip, an eight-second review of a fictional two-hour window including unrelated camera motion, and a side-by-side doorway comparison that saves qualified recovery notes. It also includes a Ring developer API adapter for authenticated device discovery, event history and video-only WebRTC/WHEP sessions.

**Integration status:** The published app and official Ring API/Playground end-to-end call have **not yet been verified**. Fictional video reconstruction is **not** footage recorded by Ring and does not satisfy the Ring-track runtime requirement on its own. A two-hour time-lapse demonstration is not verified continuous video, and it cannot prove non-delivery. Do not conflate the Ring developer adapter with a connected Ring account.

## Reproduce the source checks

Use Node 22 and the Node package manager:

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm test
node --test scripts/*.test.mjs
```

The customer-to-management workflow uses server-side Base44 entities and functions; compiling its frontend alone is **not** an end-to-end functional demo. To run the full app, link a developer workspace and run the local backend per the setup instructions below. The app's actual web experience must be verified separately after publication.

## Judges and reviewers

- Customer workflow: Select package → Details → View/compare simulated footage → Submit → confirm receipt.
- Management workflow: Open customer report → Compare entrances → mark identifying factors → save investigation.
- Ring adapter: `src/pages/RingIntegration.jsx`, `src/components/ring/RingStreamPlayer.jsx`, and `base44/functions/ringIntegration/entry.ts`. An official test requires valid authorized Ring developer credentials, backend-only storage, and a documented successful device/stream call. Do not use fictional fixtures as evidence of qualification.
- Simulation sources: `base44/shared/customerDoorbellProfiles.js`, `base44/shared/doorbellWindowMotion.js`. All non-courier motion during the fictional window is included, and real authorized capture must preserve all movements as available, with capture gaps disclosed.
- [Full simulated evidence contract](docs/DOORBELL-LOCATION-COMPARISON.md)
- [Official rules](https://amazonappdev2026.devpost.com/rules)

\n## Developer environment and publishing\n\nUse this repository to run and edit the app locally, then publish changes back through Base44.

Changes in this repository and in the app workspace require explicit parity verification. Do not assume a repository push is already published.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. Your app id is in the Builder URL (`app.base44.com/apps/<id>/...`); `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (`[base44] Proxy not enabled`, every `/api` call fails), and alongside `base44 dev` the second Vite silently takes the next port and you end up looking at the wrong one.
- **The app must be published at least once for the UI to load under `base44 dev`.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Everything else (Core integrations, OAuth login) is forwarded to your deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

## Frontend Only, Hosted Backend

To work on just the frontend against your app's live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data** — plain `base44 dev` keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

## Docs & Support

GitHub integration: [https://docs.base44.com/developers/app-code/local-development/github](https://docs.base44.com/developers/app-code/local-development/github)

Local development: [https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)

Support: [https://app.base44.com/support](https://app.base44.com/support)