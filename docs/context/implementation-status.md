# Implementation Status - 2026-05-12

This reflects local repo analysis and smoke testing. Update as the code changes.

## Current Shape

Null City v2 is a Bun monorepo:

- `services/api`: Hono API on port 3100.
- `services/inference`: OpenAI-compatible inference wrapper on port 3102.
- `services/tick`: worker that decays resident attention/lifespan and archives deaths.
- `webapp`: SvelteKit app on port 3101.
- `packages/db`: Drizzle schema and migrations.
- `packages/types`: static factions/resources/achievements.
- `packages/auth`: shared cookie/session auth against landing-2026-owned tables.

Local dev uses Docker/OrbStack for Postgres and Bun for services.

The current architecture is intentionally much easier to run and deploy than v1. That makes
it a good base for the June 1 event demo, but it also means several of the more interesting
autonomous-resident ideas are still design/implementation work rather than working code.

## What Works Locally

The project can be booted locally with the existing scripts after installing dependencies.
The setup script creates local auth stubs, migrates the database, and seeds the flagship
faction residents.

Verified locally:

- Dependency install.
- Postgres startup through Docker/OrbStack.
- Migration generation/application.
- Seeded faction residents.
- API, webapp, inference wrapper, and tick worker startup.
- Typecheck/build after a few local fixes.
- Staff scan flow can credit Shards.
- Dashboard can show basic faction cards and shard balance.

## Current UI Surface

Implemented or partially implemented:

- `/`: auth gate / landing.
- `/dashboard`: basic visitor dashboard with factions and shard balance.
- `/staff`: staff scanner flow.
- `/staff/print-jobs`: print queue.
- `/wall`: public wall state.

Missing or incomplete:

- Resident chat UI.
- Inventory/resource UI.
- Achievement redemption UI.
- Library of Souls UI.
- Visitor-spawned resident UI.
- Rich wall map layout.
- Debug/admin tools for understanding resident state.

## Current AI Behavior

The API has resident chat endpoints and an inference service wrapper. The current AI role is
mostly reactive: a resident persona plus memory context can generate replies to a human.

The current code does not yet implement autonomous resident behavior like independent goals,
agent-to-agent action, world projects, or resident-initiated quests.

The intended future direction appears to be a modular autonomy layer that can sit on top of
the v2 event economy: residents receive attention, form memories, pursue small goals, affect
faction/world state, and eventually leave artifacts in the Library of Souls.

## Known Local Changes From Initial Bring-Up

These were useful local setup/build fixes and should be reviewed separately from this context
branch before being merged:

- `webapp/tsconfig.json`: allow `.ts` import extensions for SvelteKit checking.
- `webapp/package.json` / `bun.lock`: direct `drizzle-orm` dependency for the webapp.
- `webapp/src/routes/wall/+page.svelte`: explicit callback parameter types.
- `packages/db/migrations/`: generated migrations.

Those are implementation changes, not part of the context docs, and should probably become
their own setup/bootstrapping PR if still needed.

## Deployment Notes

The repo is intended to deploy as a small Docker Compose stack on a VPS or simple PaaS:

- Postgres
- API
- Tick worker
- Inference wrapper
- Webapp

Open items before a real public deployment:

- Decide hosting target: VPS, Railway, DigitalOcean, etc.
- Decide domain/subdomain and cookie domain.
- Decide inference backend and key management.
- Add a reverse proxy for webapp plus `/v1/*` API routing.
- Avoid putting personal API keys into long-lived shared infrastructure.
- Confirm production build does not require live DB env during image build, or make DB access lazy.

## Risks

- The current README/CLAUDE context can make v2 sound less autonomous than Dev intends.
- Code alone currently suggests faction NPC/resource issuer behavior, not full resident agency.
- Inference upstreams can fail silently unless health checks test real completion calls.
- Badge and resource-signing details are still underspecified.
- The June 1 demo needs a narrow vertical slice, not every implied mechanic.
