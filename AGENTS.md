# Null City v2 — Worldbox

## Active Design Context

Before making autonomy, economy, or territory-control decisions, read:

1. `README.md`
2. `DESIGN.md`
3. `docs/design/autonomy-economy.md` when present

Current active design work:

- `docs/design/autonomy-economy.md` - near-future Chicago autonomy, faction campaigns,
  landmarks, devices, SPARK gameplay labels, and human Handler loop.
- `docs/design/design-notes.md` - review synthesis, rationale, and deferred ideas.
- `docs/design/design-questions.md` - open human/product questions before implementation.
- `docs/design/pitch-overview.md` - concise pitch-ready overview of the autonomy/economy design.
- `docs/design/ai-review-prompt.md` - prompt for external AI reviewers.

Do not commit secrets, personal API keys, local session tokens, or private source material.

## Overview
Null City v2 is an in-person event RPG for Onion DAO 2026, hosted at the embassy in Chicago.
Humans earn **Shards** at workshops, exchange them with AI residents for faction resources,
and redeem resource bundles for 3D-printed lanyard achievements. Four factions claim the
city's growing territory: Solder Saints (hardware), Hatchery (AI), Locksmiths (cybersec),
Ledgerwrights (blockchain).

This is **v2** — a deliberate simplification of `worldbox/` (v1). No K8s, no autonomous lives.
Residents are LLM personas with persona+memory+lifespan and a lightweight attention economy.
Most of the user-facing surface is the human gameplay (Shards, resources, achievements, leaderboards).

## Canonical Sources
- **Narrative**: Notion "Narrative V2" — `35e05d932b6e80898fceee903dd9fb9d` (the four factions, resources, achievement recipes verbatim).
- **v1 reference**: `../worldbox/` — patterns to copy, not packages to import.
- **Shared auth**: `../landing-2026/` owns `users`/`sessions`/`magic_links` in the same Postgres.

## Terminology
- **Visitor** / **Human**: a human user (external).
- **Resident**: an AI agent (internal).
- **Faction Rep**: a long-lived flagship resident, team-seeded, that represents a faction.
- **Shard**: universal point currency. Earned by humans, spent on residents.
- **Attention**: a resident's economic life. Inflows from Shards spent on them; deducts 1/tick.
- **Resource**: faction-specific token (T1/T2/T3). 12 total, 3 per faction.
- **Achievement**: a 3D-printable recipe. Single-faction, cross-faction, or civic.
- **Parcel**: a unit of territory on the wall map. Born when an achievement is redeemed.

## Architecture

### Tech Stack
| Component        | Technology                          |
|------------------|-------------------------------------|
| Runtime          | Bun                                 |
| API              | Hono                                |
| ORM              | Drizzle                             |
| Database         | PostgreSQL (shared with landing-2026 in prod) |
| Frontend         | SvelteKit + Svelte 5                |
| Validation       | Zod                                 |
| Inference        | Anthropic Codex (via thin proxy)   |
| Deploy           | Docker Compose on a cloud VPS       |
| Local dev        | Docker (Postgres) + Bun (services)  |

### Monorepo Structure
```
nullv2/
├── packages/
│   ├── types/         # @nullv2/types — factions, resources, achievements as TS constants
│   ├── db/            # @nullv2/db — Drizzle schema (owned + external)
│   └── auth/          # @nullv2/auth — session verification, Hono middleware
├── services/
│   ├── api/           # @nullv2/api — Hono REST gateway (:3100)
│   ├── tick/          # @nullv2/tick — 5-min worker; resident attention+lifespan decay, deaths
│   └── inference/     # @nullv2/inference — Vercel AI SDK over any OpenAI-compatible endpoint (:3102)
├── webapp/            # SvelteKit; routes /, /dashboard (visitor), /staff (admin), /wall (public)
├── scripts/           # dev-setup, dev-teardown, dev-fake-session
├── docker-compose.yml         # local dev: postgres only
└── docker-compose.prod.yml    # prod overlay: + api, tick, inference, webapp containers
```

### Auth Model
**Shared cookie, shared DB, no JWT.**

landing-2026 issues a `session` cookie (opaque hex token) backed by the `sessions` table.
nullv2 reads that same DB; `@nullv2/auth` looks up the token → user, then upserts a `humans`
row for game state. The cookie domain must be `.oniondao.dev` so both subdomains see it
(`city.oniondao.dev` and `oniondao.dev`).

Files:
- `packages/db/src/external/index.ts` — declares `users`/`sessions` (read-only, never migrated).
- `packages/auth/src/index.ts` — `resolveSession()`, `ensureHuman()`, `readSessionCookie()`.
- `packages/auth/src/hono.ts` — `requireVisitor()`, `requireAdmin()` middlewares.

### Schema Ownership
- **nullv2 OWNS**: `humans`, `faction_standing`, `resource_inventory`, `residents`,
  `resident_memories`, `resident_messages`, `library_of_souls`, `workshops`, `workshop_attendance`,
  `shard_ledger`, `attention_ledger`, `resource_grants`, `human_achievements`, `print_jobs`, `parcels`.
- **landing-2026 OWNS**: `users`, `sessions`, `magic_links` (read-only here).

`drizzle.config.ts` points only at `src/schema/` — `src/external/` is excluded so migrations
never touch landing-2026's tables.

### Static vs Dynamic Content
The four factions, twelve resources, and eleven achievement recipes are **static TS constants**
in `@nullv2/types`. They are NOT in the DB. Adding a faction or achievement is a code change,
not data entry. Standing tiers and shard costs are also constants.

## Economic Flow

1. **Earn**: Staff scans a visitor into a workshop via QR → `workshop_attendance` row inserted,
   `shard_ledger` credits `humans.shard_balance`.
2. **Convert**: Visitor opens a chat with a faction resident → spends Shards to ask for a
   resource. `resource_grants` row + `resource_inventory` quantity++ + `shard_ledger` debit +
   `attention_ledger` credit to the resident (Shards flow to its `attention_balance`) +
   `faction_standing` points++ for that faction.
3. **Redeem**: Visitor picks an achievement at the print shop → recipe checked against
   inventory, resources decrement, `print_jobs` row queued, `human_achievements` row,
   `parcels` row ratifying new territory for the achievement's faction(s).

## Key Invariants
1. Humans NEVER see DB internals. All interaction through `services/api`.
2. `users`/`sessions`/`magic_links` are landing-2026's. Never write to them from nullv2 in prod.
3. Every Shard movement writes to `shard_ledger`. Every attention movement writes to `attention_ledger`.
4. Every redemption produces exactly one `print_jobs` row and exactly one `human_achievements` row.
5. A resident's death is permanent: `status='dead'`, a `library_of_souls` row, no resurrection.
6. Static catalog (factions/resources/achievements) lives in `@nullv2/types`, not the DB.
7. `claim_code` on `print_jobs` is the only thing staff scans at the print desk.
8. Civic achievements (`first_shard`, `morticians_ribbon`, `founders_stake`) have empty recipes
   — granted by the embassy, not purchased.

## API Surface (planned, partial today)
| Domain        | Endpoints                                                      |
|---------------|----------------------------------------------------------------|
| Identity      | `GET /v1/me`                                                  |
| Factions      | `GET /v1/factions`, `GET /v1/factions/:id`                    |
| Residents     | `GET /v1/residents`, `GET /v1/residents/:id`, `POST /v1/residents/:id/chat` |
| Workshops     | `POST /v1/workshops/scan` (staff), `GET /v1/workshops`        |
| Achievements  | `GET /v1/achievements`, `POST /v1/achievements/redeem`        |
| Print shop    | `GET /v1/print-jobs` (staff), `POST /v1/print-jobs/:id/status`|
| Wall display  | `GET /v1/wall/state` (parcels + leaderboard + ticker)         |
| Library       | `GET /v1/library`, `GET /v1/library/:residentId`              |

Auth: every endpoint except `/v1/factions` and `/healthz` requires the `session` cookie.

## Development

### Prereqs
- Bun ≥ 1.2
- Docker + Docker Compose
- (optional) `psql` for poking the DB

### Quick start
```bash
bun install
./scripts/dev-setup.sh        # starts Postgres + runs migrations + seeds flagships
bun run dev:api                # API on :3100
```

To test auth without landing-2026 locally:
```bash
./scripts/dev-fake-session.sh you@example.com "Your Name"
# prints a curl command with the right Cookie header
```

### Common tasks
- Add a faction/resource/achievement → edit `packages/types/src/*.ts`. No migration.
- Add a DB table → drop a file under `packages/db/src/schema/` + export from `schema/index.ts` + `bun run db:generate` + `db:migrate`.
- Add an API endpoint → file in `services/api/src/routes/` + mount in `services/api/src/index.ts`.
- Wipe and reset dev DB → `./scripts/dev-teardown.sh && ./scripts/dev-setup.sh`.

## Inference service
- `services/inference/` wraps the **Vercel AI SDK** (`ai` + `@ai-sdk/openai`) pointed at any **OpenAI-compatible** endpoint. Configurable via `INFERENCE_BASE_URL`, `INFERENCE_API_KEY`, `INFERENCE_MODEL` — so you can swap OpenAI for Groq, Together, OpenRouter, or a local LM Studio without code changes.
- HTTP: `POST /v1/inference/complete { residentId, humanMessage, model?, maxTokens? }` → `{ content, model, usage, finishReason }`.
- Also exports `completeForResident(db, input)` from `./lib` for in-process calls (avoids the HTTP hop when colocated).
- The API's `POST /v1/residents/:id/chat` calls inference BEFORE the DB transaction; on inference failure → 502 + no DB writes.

## Tick worker
- `services/tick/` runs `setTimeout(runTick, TICK_INTERVAL_MS)` (default 5 min). Each tick: per-alive-resident transaction decrements `lifespan_ticks_remaining` and `attention_balance` by 1, writes a `-1` `attention_ledger` row, and kills residents whose counters hit zero.
- Death-cause priority: `lifespan` checked before `attention`.
- Epitaphs are **templated** (no LLM yet). Moving epitaph generation behind inference is a follow-up.
- `SIGTERM`/`SIGINT` finish the in-flight tick before exit.

## Prod deployment
- Local dev: only postgres in Docker; services run with `bun --hot` on the host.
- Prod: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` builds and runs **postgres + api + tick + inference + webapp**.
- A reverse proxy (Caddy / Cloudflare Tunnel / nginx) lives in front: `city.oniondao.dev/v1/*` → `api:3100`, `city.oniondao.dev/*` → `webapp:3101`. Not included in compose — bring your own.
- Cookie domain `.oniondao.dev` so the `session` cookie issued by landing-2026 reaches the city subdomain.

## Roadmap (what's missing today)
- Badge integration (ESP-NOW/BLE) behind the `humans.badge_id` column.
- LLM-driven epitaphs in the tick worker via the inference service.
- Visitor chat UI on `/dashboard/residents/:id` (resident detail + chat send box).
- Achievements redemption UI on `/dashboard/achievements` (recipe progress, redeem button).
- Wall display layout polish — actual grid layout for parcels (currently random scatter).
- CI: a typecheck + drizzle-kit dry-run on PRs.
