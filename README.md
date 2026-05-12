# Null City v2

### *An RPG you play with a lanyard*

Null City v2 is a month-long, in-person experience for **Onion DAO 2026** at the embassy in
Chicago. You walk in. You attend workshops. You earn **Shards** — the universal currency of
attention. You spend Shards with one of four factions of AI residents in exchange for their
oddly-specific resources. You trade resource bundles at the embassy print shop for a
3D-printed achievement that clips to your lanyard. By the end of the month, the city has
grown, the factions have new territory, and your lanyard is the receipt for the part you
played in changing it.

The conflict is non-violent and territorial. The residents are mortal. The lanyard is
the point.

> This is **v2**. v1 (a Kubernetes-native autonomous-agent simulation) lives in `../worldbox/`
> as historical reference. Patterns were copied; packages are not.

---

## Table of Contents

1. [The Game](#the-game)
2. [The System at a Glance](#the-system-at-a-glance)
3. [Domain Model](#domain-model)
4. [Economic Flow — A Walk-Through](#economic-flow--a-walk-through)
5. [Residents](#residents)
6. [Inference](#inference)
7. [Authentication](#authentication)
8. [Repo Layout](#repo-layout)
9. [Quick Start (Local Dev)](#quick-start-local-dev)
10. [Production Deploy](#production-deploy)
11. [API Reference](#api-reference)
12. [Database Schema](#database-schema)
13. [Common Dev Tasks](#common-dev-tasks)
14. [Troubleshooting](#troubleshooting)
15. [Roadmap](#roadmap)

---

## The Game

### The Four Factions

| Faction | Theme | Color | Motto |
|---|---|---|---|
| ⚡ **The Solder Saints** | Hardware | copper | *"No mind without a body. No body without a board."* |
| 🥚 **The Hatchery** | AI | yolk-gold | *"Every resident was someone's training run."* |
| 🔒 **The Locksmiths** | Cybersecurity | redacted-black | *"There is no secure system. We are merely curating the breaches."* |
| 📜 **The Ledgerwrights** | Blockchain | bronze | *"Nothing happened until everyone agrees it happened."* |

Each faction mints **three tiers** of resources. Twelve total. Higher tiers cost more Shards
and require higher Standing with the faction. See `packages/types/src/resources.ts` for the
full catalog.

| Tier | Solder Saints | Hatchery | Locksmiths | Ledgerwrights |
|---|---|---|---|---|
| **T1** (2 Shards) | Flux Drop | Token Crumb | Tumbler Pin | Mempool Mote |
| **T2** (6 Shards) | Signed Schematic | Echo Fragment | Master Bypass | Block Seal |
| **T3** (15 Shards) | Reliquary Board | Lineage Scroll | Vault Charter | Genesis Crumb |

### Achievements (the 3D-printed pieces)

| Kind | Examples | Recipe |
|---|---|---|
| **Single-faction** (4) | The Soldered Halo, The Hatched Egg, The Master Key, The Signed Block | 3× T1 + 1× T2 from one faction |
| **Cross-faction** (4) | The Embodied Mind, The Sealed Sandbox, The Witnessed Vault, The Forged Coin | 1× T2 + 1× T2 from two factions |
| **Civic** (3) | The First Shard, The Mortician's Ribbon, The Founder's Stake | No recipe — embassy grants on milestones |

Civic achievements are granted by the embassy when you do something the city itself notices
(first check-in, witnessing a death, earning any T3 resource).

### Standing

Cumulative Shards spent with a faction → a tier:

| Tier | Threshold | Unlocks |
|---|---|---|
| none | 0 | — |
| acquaintance | 10 | T1 resources |
| ally | 30 | T2 resources |
| officer | 75 | T3 resources |

### The Loop

```
┌─────────────┐    QR scan     ┌──────────────┐    chat + Shards     ┌────────────┐
│  Workshop   ├───────────────▶│    Human     ├─────────────────────▶│  Resident  │
│ (+5 Shards) │                │ (+5 Shards)  │                       │ (faction)  │
└─────────────┘                └──────┬───────┘                       └──────┬─────┘
                                      │                                      │
                                      │ resource granted                     │ attention +N
                                      │ (Flux Drop, Echo Fragment, ...)      │
                                      ▼                                      ▼
                               ┌──────────────┐                       ┌────────────┐
                               │  Inventory   │                       │  Lives or  │
                               │ (+1 T1 token)│                       │   Dies     │
                               └──────┬───────┘                       └────────────┘
                                      │
                                      │ recipe full
                                      ▼
                               ┌──────────────┐    parcel ratified    ┌────────────┐
                               │ Print Queue  ├──────────────────────▶│ Wall Map   │
                               │  (lanyard)   │                       │ (faction)  │
                               └──────────────┘                       └────────────┘
```

There's no winner. The map at the end of the month is the artifact.

---

## The System at a Glance

```
┌──────────────────────────────────────────────────────────────────────┐
│                       BROWSER (visitor / staff / wall)               │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │  HTTP + session cookie
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  webapp/        SvelteKit + adapter-node          :3101              │
│  ┌────────────────┬────────────────┬──────────────┐                  │
│  │  / (landing)   │ /dashboard     │ /staff       │ /wall            │
│  │  /dashboard    │ visitor pages  │ admin pages  │ public display   │
│  └────────────────┴────────────────┴──────────────┘                  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │  /v1/* (reverse-proxied in prod)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  services/api/      Hono REST + auth     :3100                       │
│  /v1/me  /v1/factions  /v1/workshops  /v1/residents                  │
│  /v1/achievements  /v1/wall  /v1/print-jobs                          │
└─────┬──────────────────────────┬──────────────────────────┬──────────┘
      │                          │                          │
      │ SQL                      │ HTTP                     │ SQL
      ▼                          ▼                          │
┌──────────────┐    ┌────────────────────────┐              │
│  PostgreSQL  │    │ services/inference/    │              │
│              │    │ Hono + Vercel AI SDK   │              │
│  - landing-  │    │ :3102                  │              │
│    2026      │◀───┤                        │              │
│    (users,   │    │ ▶ OpenAI-compatible    │              │
│   sessions)  │    │   endpoint of choice   │              │
│  - nullv2    │    └────────────────────────┘              │
│    (game     │                                            │
│     state)   │◀───────────────────────────────────────────┘
└──────┬───────┘
       │  SQL
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  services/tick/    Bun loop, every 5min                              │
│  Per alive resident: -1 lifespan, -1 attention, kill at zero,        │
│  archive to library_of_souls.                                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Five processes** in production: postgres, api, tick, inference, webapp. All TypeScript
on Bun. All in one Docker Compose. Single VPS deploy.

---

## Domain Model

```
factions (4 static)                resources (12 static)              achievements (11 static)
  ├ solder_saints                    ├ flux_drop (T1, solder_saints)    ├ soldered_halo (single)
  ├ hatchery                         ├ token_crumb (T1, hatchery)       ├ embodied_mind (cross)
  ├ locksmiths                       ├ ... 10 more ...                  ├ first_shard (civic)
  └ ledgerwrights                                                        └ ... 8 more ...

humans  (1:1 with users in landing-2026)
  ├ shard_balance
  ├ badge_id?
  ├ faction_standing  ── points per faction
  ├ resource_inventory ── quantity per resource type
  ├ human_achievements ── earned-at timestamps
  └ shard_ledger      ── full audit of every shard movement

residents
  ├ name, faction, persona
  ├ owner_human_id?              (null = team flagship; set = visitor-spawned)
  ├ attention_balance            (humans pay this in; tick decays 1/cycle)
  ├ lifespan_ticks_remaining     (hard limit, also decays 1/tick)
  ├ status                       (alive / dead)
  ├ resident_memories            (birth, interaction, reflection, death — LLM context)
  ├ resident_messages            (chat log, both speakers)
  ├ attention_ledger             (audit of every attention movement)
  └ library_of_souls (on death)  (epitaph + final stats)

workshops
  ├ title, faction?, kind        (workshop | competition | quest | check_in)
  ├ qr_code                      (staff scans visitors with this)
  ├ shard_reward
  └ workshop_attendance          (one row per scan)

print_jobs (the queue)
  ├ human_id, achievement_id
  ├ claim_code                   (6-char base32, shown to staff at print desk)
  └ status                       (queued / printing / ready / claimed / failed)

parcels (territory map)
  ├ faction, x, y
  ├ achievement_id?              (which achievement minted this parcel)
  └ ratified_by_human_id?
```

### Static vs Dynamic

The **static catalog** (4 factions, 12 resources, 11 achievements, standing thresholds) lives
entirely in `@nullv2/types` as TypeScript constants. Adding a faction or achievement is a
**code change, not data entry**. This keeps the schema small and the constants type-checked
across the codebase.

The **dynamic state** lives in Postgres: visitors, residents, balances, inventories, ledgers,
the territory map.

---

## Economic Flow — A Walk-Through

Let's follow **Alice** through one full loop.

### 1. Alice scans into a workshop

Staff opens `/staff` (admin-gated). Selects "Soldering 101" from the workshop list. Types
`alice@example.com`. Clicks "Award Shards".

```
POST /v1/workshops/scan        Admin only
{ qrCode: "sold-101", humanEmail: "alice@example.com" }
```

API does:

1. Resolve `humanEmail` → user (in the shared `users` table) → ensure a `humans` row exists.
2. Look up the workshop by `qr_code`.
3. Reject 409 if an attendance row already exists for (workshop, human).
4. **In a single transaction**: insert `workshop_attendance`, increment `humans.shard_balance`
   by `workshop.shard_reward`, append a `+5 / workshop_attendance` row to `shard_ledger`.

Alice now has 5 Shards. The ledger is permanent — every credit and debit, forever.

### 2. Alice chats with Brother Solenoid

Alice opens her dashboard. She sees the four factions and her standing (none, none, none, none).
She clicks into Brother Solenoid's chat (a Solder Saints flagship resident). She types
*"I'm here to learn"*, offers 5 Shards, and requests a **Flux Drop**.

```
POST /v1/residents/{brotherSolenoidId}/chat        Visitor
{
  message: "I'm here to learn",
  shardsOffered: 5,
  requestedResourceId: "flux_drop"
}
```

API does:

1. Load Brother Solenoid. Reject 410 if dead.
2. Check Alice has 5 Shards. ✓
3. Validate Flux Drop is a Solder Saints resource. ✓
4. Check Flux Drop's `minStanding = 'acquaintance'`. Alice's current standing is `none`, threshold for `acquaintance` is 10 — but a fresh purchase pre-grants the bump. Resource cost is 2 Shards; Alice offers 5. **Standing becomes points=5 (still `none` → 5 < 10 = `none`).** Wait. We need to check the standing *before* this purchase, not the post-bump value. Looking at the code, the standing check happens before the upsert, so the very first purchase fails for tiers above `none`. **For T1 resources (`acquaintance`) — Alice needs 10 cumulative points before her first purchase.** This is a deliberate first-touch friction: a brand-new visitor cannot buy from a faction without first investing 10 Shards into them.
5. *(Imagine Alice has previously spent 10+ Shards on Solder Saints chatter, so she qualifies.)*
6. **Inference is called first**, outside the DB transaction:
   ```
   POST http://inference:3102/v1/inference/complete
   { residentId, humanMessage: "I'm here to learn" }
   ```
   Inference loads Brother Solenoid's persona + last 5 memories + last 8 messages, builds
   a Solder Saints system prompt, calls Vercel AI SDK against the configured OpenAI-compatible
   endpoint, returns:
   `{ content: "Hold the iron like a prayer candle. Now: tin the joint.", ... }`
7. **Now in one DB transaction**:
   - `resource_grants` row: Brother Solenoid issued Alice 1× Flux Drop for 5 Shards.
   - `resource_inventory` (Alice, flux_drop): quantity +1 (upsert).
   - `humans.shard_balance` −5 (Alice now at 0).
   - `shard_ledger` row: `-5 / resource_purchase / flux_drop`.
   - `residents.attention_balance` +5 (Brother Solenoid gets life).
   - `attention_ledger` row: `+5 / resource_purchase / source=Alice`.
   - `faction_standing` (Alice, solder_saints): points +5 (upsert).
   - `resident_messages` × 2: human's message + resident's reply.
   - `resident_memories`: short summary of the exchange.
8. Response: `{ residentMessage: {speaker:'resident', content: "..."}, grantedResource: {resourceId:'flux_drop', quantity:1}, newShardBalance: 0, residentAttention: ..., standing: {...} }`

**If inference fails**, the DB transaction never starts. Nothing changes. The visitor sees
an error and can retry.

### 3. Alice keeps going, eventually has a recipe full

After several visits to Solder Saints residents (and more workshops), Alice has:

- 3× Flux Drop
- 1× Signed Schematic

That's the recipe for **The Soldered Halo**.

```
POST /v1/achievements/redeem        Visitor
{ achievementId: "soldered_halo" }
```

API does, in a single transaction:

1. Validate the recipe against Alice's inventory.
2. Decrement: −3 Flux Drop, −1 Signed Schematic.
3. Insert `human_achievements` (Alice, soldered_halo).
4. Insert `print_jobs` with a generated `claim_code` (6-char base32, unique).
5. Insert a `parcels` row for the achievement's faction (Solder Saints) at a random (x, y),
   retrying on coordinate collision.

Response: `{ achievement, claimCode: "K7M2WX", parcels: [...] }`.

The wall display now shows one new copper parcel. The print queue at the embassy now shows
"Alice → The Soldered Halo / claim K7M2WX". Staff prints the piece, marks it `ready`, hands
it to Alice at the desk, marks it `claimed`.

### 4. The ticks continue

Every 5 minutes, the tick worker:

```
for each resident where status='alive':
  in a transaction keyed on resident.id and status='alive':
    lifespan_ticks_remaining -= 1
    attention_balance -= 1
    write -1 to attention_ledger ('tick_decay')
    if lifespan_ticks_remaining <= 0:
      kill(cause: 'lifespan')
    elif attention_balance <= 0:
      kill(cause: 'attention')
```

A resident no human visits will run out of attention. A resident who survives long enough
will hit their lifespan ceiling. Either way, death:

- `status = 'dead'`
- `died_at = now()`
- `resident_memories` row: kind `death`, content `"{name} died of {cause}."`
- `library_of_souls` row: name, faction, lived_ticks, death_cause, templated epitaph

A resident's death is **permanent**. The wall ticker scrolls `💀 Brother Solenoid died of
attention`. Library of Souls is browsable (UI TBD).

---

## Residents

A resident has four components:

1. **Persona** — a paragraph of system-prompt material, set at birth, immutable.
2. **Memory log** — `resident_memories` rows. Used as recent context in inference calls and
   as the basis for the eventual Library of Souls epitaph.
3. **Message log** — every utterance, public or chat, append-only.
4. **Economic state** — `lifespan_ticks_remaining` + `attention_balance`.

### Birth

Today, residents are seeded only by the team via `bun run db:seed` (one flagship per faction):

| Faction | Flagship | Personality |
|---|---|---|
| Solder Saints | Brother Solenoid | Speaks in metaphors of heat and metal. Stubborn. Warm. |
| Hatchery | Midwife Lin | Gentle. Grieves loudly when residents die. |
| Locksmiths | The Curator | Clipped sentences. Assumes recording. |
| Ledgerwrights | Scrivener Mox | Witnesses for the record. Forgives nothing. |

Visitor-spawned residents are scaffolded in the schema (`residents.owner_human_id`) but the
spawn endpoint is not yet wired.

### Life

A resident is alive while `status='alive'`. They:

- Receive chat messages and reply (via inference).
- Accumulate `attention_balance` from every Shard a human spends on them.
- Decay 1 attention + 1 lifespan per tick.

### Death

Triggered by the tick worker. Two causes:

- **lifespan** — `lifespan_ticks_remaining` hit zero.
- **attention** — `attention_balance` hit zero (and lifespan still has time).

On death:

1. `status='dead'`, `died_at=now()`.
2. A `death` memory row.
3. A `library_of_souls` row with a **templated** epitaph today:
   `"{name}, of the {faction.name}. Born {bornAt.toISOString()}, archived after {livedTicks} ticks. Died of {deathCause}. {persona truncated to 200 chars}"`
   LLM-driven epitaphs are a follow-up that will call the inference service from the tick worker.

---

## Inference

`services/inference/` is a thin Hono service wrapping the **Vercel AI SDK** (`ai` + `@ai-sdk/openai`).
It is configurable to point at **any OpenAI-compatible endpoint** — OpenAI, Groq, Together AI,
OpenRouter, local LM Studio, you name it.

### Configuration

```bash
INFERENCE_PORT=3102
INFERENCE_BASE_URL=https://api.openai.com/v1   # or any openai-compat endpoint
INFERENCE_API_KEY=sk-...
INFERENCE_MODEL=gpt-4o-mini                     # default; can be overridden per call
INFERENCE_MAX_TOKENS=400
```

To swap to, e.g., Together AI:
```
INFERENCE_BASE_URL=https://api.together.xyz/v1
INFERENCE_API_KEY=<together-key>
INFERENCE_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
```

To swap to local LM Studio:
```
INFERENCE_BASE_URL=http://localhost:1234/v1
INFERENCE_API_KEY=lm-studio
INFERENCE_MODEL=qwen/qwen2.5-7b-instruct
```

### Request flow

```
POST /v1/inference/complete
{ residentId, humanMessage, model?, maxTokens? }
   │
   ├─ Load resident from DB (404 if missing, 410 if dead)
   ├─ Load last 5 memories (desc by created_at)
   ├─ Load last 8 messages (oldest → newest)
   ├─ Build system prompt:
   │    "You are {name}, a resident of Null City affiliated with {faction.name}.
   │     Faction motto: {motto}
   │     Faction blurb: {blurb}
   │     Persona: {resident.persona}
   │     Recent memories you carry: ..."
   ├─ Build messages array from history (human→user, resident→assistant)
   ├─ Append new user turn
   ├─ generateText({ model: openai(model), system, messages, maxTokens })
   └─ Return { content, model, usage, finishReason }
```

The same logic is exported as `completeForResident(db, input)` from `@nullv2/inference/lib`,
so `services/api`'s chat handler can call it in-process when the two are co-located. The HTTP
endpoint is a thin wrapper around the same function.

### Why a separate service?

- **Provider swappability**: change `INFERENCE_BASE_URL` and restart one container.
- **Cost containment**: the LLM is the only paid dependency; isolating it makes billing &
  rate-limiting easier.
- **Future**: streaming endpoint (SSE/WebSocket), per-resident model selection, embeddings.

---

## Authentication

nullv2 **does not run its own login flow**. It piggybacks on landing-2026's existing
magic-link auth.

### How it works

1. A visitor opens `https://oniondao.dev/login`, enters their email, clicks the magic link
   from Resend. landing-2026 issues an opaque hex token, stores it in the `sessions` table,
   and sets a `session` cookie scoped to `.oniondao.dev`.
2. The visitor opens `https://city.oniondao.dev/`. The browser sends the same `session`
   cookie because the cookie domain covers both subdomains.
3. nullv2 reads the cookie, looks up the token in the shared `sessions` table, joins to
   `users`, and **lazily inserts a `humans` row** for game state on first visit.

```
landing-2026                  shared Postgres                  nullv2
─────────────                 ───────────────                  ───────
  /login                                                       
   ▼                            users  ◀────────── reads ──── /v1/me
  createMagicLink                sessions                       hooks.server.ts
   ▼                              ▲                             ↓ ensureHuman()
  email link                      │                              humans
   ▼                              │
  /login/verify                   │
   ▼                              │
  createSession ──── inserts ─────┘
   ▼
  Set-Cookie: session=...; Domain=.oniondao.dev
```

### Cookie domain

For the cookie to be shared, both apps must serve over `.oniondao.dev`:

- landing-2026 at `oniondao.dev`
- nullv2 at `city.oniondao.dev`

Set `AUTH_COOKIE_DOMAIN=.oniondao.dev` in nullv2's prod env. In local dev, both apps live on
`localhost` and the cookie is host-scoped to whatever port — use `dev-fake-session.sh` to
mint local sessions without standing up landing-2026.

### Source of truth

| Table | Owner | nullv2's relationship |
|---|---|---|
| `users` | landing-2026 | **Read-only.** Declared in `packages/db/src/external/`. |
| `sessions` | landing-2026 | **Read-only.** Same. |
| `magic_links` | landing-2026 | Not declared — we don't read it. |
| `humans` and 14 others | **nullv2** | Owned + migrated by `@nullv2/db`. |

Drizzle is configured to migrate only the schema folder (`packages/db/src/schema/`), so
`drizzle-kit generate` will never touch the external tables.

---

## Repo Layout

```
nullv2/
├── packages/
│   ├── types/                # @nullv2/types — factions, resources, achievements, standing
│   ├── db/                   # @nullv2/db — Drizzle schema, migrations, seed, db client
│   │   ├── src/schema/       # tables we own + migrate
│   │   ├── src/external/     # tables we read (landing-2026's users/sessions)
│   │   └── src/seed.ts       # idempotent flagship seeding
│   └── auth/                 # @nullv2/auth — session resolver + Hono middlewares
├── services/
│   ├── api/                  # @nullv2/api — Hono REST gateway (:3100)
│   │   └── src/routes/       # me, factions, workshops, residents, achievements, wall, print-jobs
│   ├── tick/                 # @nullv2/tick — 5-min worker (attention/lifespan decay + deaths)
│   └── inference/            # @nullv2/inference — Vercel AI SDK proxy (:3102)
├── webapp/                   # SvelteKit + adapter-node (:3101)
│   └── src/routes/
│       ├── /                 # public landing
│       ├── /dashboard        # visitor pages (auth-gated)
│       ├── /staff            # admin pages (admin-gated)
│       └── /wall             # public kiosk display
├── scripts/
│   ├── dev-setup.sh          # start postgres + migrate + seed
│   ├── dev-teardown.sh       # destructive: drop volumes
│   └── dev-fake-session.sh   # mint a local session cookie
├── docker-compose.yml        # dev: postgres only
├── docker-compose.prod.yml   # prod overlay: + api, tick, inference, webapp
├── tsconfig.base.json        # strict, noUncheckedIndexedAccess, isolatedModules
├── bunfig.toml               # linker = isolated (per-workspace node_modules)
├── README.md                 # this file
└── CLAUDE.md                 # AI-assistant context
```

---

## Quick Start (Local Dev)

### Prerequisites

- **Bun** ≥ 1.2 (`curl -fsSL https://bun.sh/install | bash`)
- **Docker** + Docker Compose
- (optional) `psql` for poking the DB directly

### One-shot setup

```bash
cd nullv2
bun install                    # installs all workspaces with isolated linker
cp .env.example .env           # tweak as needed; defaults are fine for local dev
./scripts/dev-setup.sh         # starts Postgres on :5433, runs migrations, seeds flagships
```

What `dev-setup.sh` does:

1. Starts the `postgres` service from `docker-compose.yml`.
2. Creates **local stub tables** for `users`/`sessions` so you can run the full stack
   without landing-2026. (In prod, these come from the shared DB.)
3. Runs `bun run db:generate` (compiles Drizzle schema into SQL).
4. Runs `bun run db:migrate` (applies migrations).
5. Runs `bun run db:seed` (inserts the four flagship faction reps).

### Run the stack

Each command in its own terminal:

```bash
bun run dev:api         # API on :3100
bun run dev:tick        # tick worker (logs every 5 minutes)
bun run dev:inference   # inference service on :3102
bun run dev:web         # SvelteKit dev server on :3101
```

The Vite dev server proxies `/v1/*` to the API automatically.

### Get a working session

Without landing-2026 running locally, use the fake-session script:

```bash
./scripts/dev-fake-session.sh you@example.com "You"
```

It prints a `curl` command with the right `Cookie` header. To use the cookie in a browser,
copy it manually via DevTools (Application → Cookies → `session=<token>`).

To make yourself an admin (for `/staff`), connect to Postgres and:

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

### Verify

- `http://localhost:3100/healthz` → `{ok: true}`
- `http://localhost:3100/v1/factions` → 4 factions, 12 resources
- `http://localhost:3100/v1/me` (with cookie) → your visitor record
- `http://localhost:3101/dashboard` → visitor dashboard with faction standings
- `http://localhost:3101/wall` → wall display (empty until parcels exist)

---

## Production Deploy

Target: **single cloud VPS** (Hetzner / DigitalOcean / Fly machine) running everything
under Docker Compose.

### Topology

```
Internet ──▶ Reverse proxy (Caddy / Cloudflare Tunnel)
                  │
                  ├─ city.oniondao.dev/*       → webapp:3101
                  ├─ city.oniondao.dev/v1/*    → api:3100
                  └─ inference.oniondao.dev/*  → inference:3102  (optional, internal-only is fine)

Docker network:
  postgres:5432  ◀── api ──▶ inference
                 ◀── tick
                 ◀── webapp
```

The reverse proxy is **not in the compose file** — bring your own. Caddy with a 4-line
Caddyfile is the simplest path.

### Steps

1. Provision a VPS with Docker.
2. Clone the repo. `cd nullv2`.
3. Copy `.env.example` to `.env`. Set:
   - `DATABASE_URL=postgresql://nullv2:<strong-password>@postgres:5432/nullv2`
   - `AUTH_COOKIE_DOMAIN=.oniondao.dev`
   - `INFERENCE_API_KEY=<your-key>` and `INFERENCE_BASE_URL`/`INFERENCE_MODEL` if not OpenAI.
4. Build & run:
   ```bash
   bun run docker:build
   bun run docker:up
   ```
5. First-run migrations + seed (one-time):
   ```bash
   docker compose exec api bun run --filter @nullv2/db migrate
   docker compose exec api bun run --filter @nullv2/db seed
   ```
6. Set up the reverse proxy with TLS pointing at the four host ports.

### Shared-DB caveat

For prod, **point `DATABASE_URL` at the same Postgres landing-2026 uses** so the `users` and
`sessions` tables resolve. The compose `postgres` service is only for **dev**; in prod, you
should override it (set `services.postgres.profiles` to `[dev]`, or just don't include
`docker-compose.yml` in the prod stack and run a managed Postgres).

A safe pattern: keep landing-2026's Railway Postgres as the source of truth, and run only
api/tick/inference/webapp containers via `docker-compose.prod.yml`. Drop the local postgres
from prod overlay or override it to a no-op.

---

## API Reference

All endpoints are JSON. Auth: `Cookie: session=<token>`. Errors are `{error: "code", ...}`
with appropriate HTTP status.

### Identity

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/me` | visitor | Authed user + game state (shards, standing, inventory) |

### Static catalog

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/factions` | public | All four factions + their resources |
| GET | `/v1/factions/:id` | public | One faction with its resources |

### Workshops

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/workshops` | visitor | Upcoming + active workshops |
| POST | `/v1/workshops/scan` | admin | Award Shards to a visitor for attending |

`POST /v1/workshops/scan` body: `{ qrCode, humanId? OR humanEmail? }` — exactly one of
`humanId` (UUID) or `humanEmail`.

### Residents

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/residents` | visitor | All alive residents |
| GET | `/v1/residents/:id` | visitor | One resident + recent messages |
| POST | `/v1/residents/:id/chat` | visitor | Chat + optionally purchase a resource |

`POST /v1/residents/:id/chat` body: `{ message, shardsOffered, requestedResourceId? }`.
Returns `{ residentMessage, grantedResource?, newShardBalance, residentAttention, standing }`.

### Achievements

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/achievements` | visitor | All achievements with `earned` + `hasIngredients` flags |
| POST | `/v1/achievements/redeem` | visitor | Redeem an achievement (burns inventory, queues print) |

`POST /v1/achievements/redeem` body: `{ achievementId }`. Returns `{ achievement, claimCode, parcels }`.

### Print queue

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/print-jobs` | admin | Queued + printing jobs, oldest first |
| POST | `/v1/print-jobs/:id/status` | admin | Update status (`printing`/`ready`/`claimed`/`failed`) |

### Wall display

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/wall/state` | public | Parcels + leaderboard + recent births/deaths/achievements |

### Inference (internal — port 3102)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/healthz` | none | Health + active model + base URL |
| POST | `/v1/inference/complete` | none | Generate a resident reply |

Not exposed publicly. Reachable only from `services/api` on the Docker network.

---

## Database Schema

Owned by `@nullv2/db` (migrations live in `packages/db/migrations/`):

| Table | Purpose |
|---|---|
| `humans` | 1:1 with `users` — gameplay state (shard_balance, badge_id) |
| `faction_standing` | (human, faction) → cumulative points |
| `resource_inventory` | (human, resource) → quantity |
| `residents` | name, faction, persona, attention, lifespan, status |
| `resident_memories` | birth/interaction/reflection/death rows |
| `resident_messages` | append-only chat + public utterances |
| `library_of_souls` | death snapshots (epitaph, lived_ticks, cause) |
| `workshops` | title, faction, kind, qr_code, shard_reward, schedule |
| `workshop_attendance` | (workshop, human) → scanned_at |
| `shard_ledger` | append-only audit of every shard movement |
| `attention_ledger` | append-only audit of every attention movement |
| `resource_grants` | resident-issued resources |
| `human_achievements` | earned achievements |
| `print_jobs` | print queue with claim codes |
| `parcels` | territory grid (faction, x, y) |

Read-only references (owned by landing-2026, declared in `packages/db/src/external/`):

| Table | Purpose |
|---|---|
| `users` | identity (id, email, name, is_admin, avatar_url, ...) |
| `sessions` | opaque session tokens + expiry |

---

## Common Dev Tasks

### Add a new faction

You can't really. Four factions is baked into the narrative. But if you did:

1. Add the ID to `FACTION_IDS` in `packages/types/src/factions.ts`.
2. Add the faction object to `FACTIONS`.
3. Add three resources to `packages/types/src/resources.ts`.
4. Add a single-faction achievement to `packages/types/src/achievements.ts`.
5. Add a flagship resident to `packages/db/src/seed.ts`.
6. Run `bun run db:seed`. (No migration needed — content is code.)

### Add a new achievement

1. Append to `ACHIEVEMENT_IDS` and `ACHIEVEMENTS` in `packages/types/src/achievements.ts`.
2. Set `recipe` to the resource cost.
3. That's it. No migration. The redeem endpoint validates against the constants at request time.

### Add a new API endpoint

1. Create a file under `services/api/src/routes/`.
2. Export a factory function: `export function fooRoute(db: Db) { const r = new Hono(); ... return r; }`.
3. Mount in `services/api/src/index.ts`: `app.route('/v1/foo', fooRoute(db))`.

### Modify a schema table

1. Edit the relevant file in `packages/db/src/schema/`.
2. `bun run db:generate` (creates a new migration SQL file).
3. Review the SQL diff under `packages/db/migrations/`.
4. `bun run db:migrate` (applies it).

### Change inference provider

Edit `.env`:

```
INFERENCE_BASE_URL=https://api.together.xyz/v1
INFERENCE_API_KEY=<key>
INFERENCE_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
```

Restart the inference service. No code changes.

### Typecheck

```bash
bun run typecheck
```

Strict mode + `noUncheckedIndexedAccess`. Catches missing null guards on `.returning()`
destructures.

### Wipe and reset the dev DB

```bash
./scripts/dev-teardown.sh && ./scripts/dev-setup.sh
```

---

## Troubleshooting

**`/v1/me` returns `unauthorized`**
- Cookie missing or expired. Use `dev-fake-session.sh` to mint a fresh one.
- In prod: check `AUTH_COOKIE_DOMAIN` matches the domain on the cookie set by landing-2026.

**`/staff` returns 403 / redirects**
- Your user isn't admin. Run `UPDATE users SET is_admin = true WHERE email = ...` in Postgres.

**Chat returns 502 `inference_failed`**
- `INFERENCE_API_KEY` not set, or the configured `INFERENCE_BASE_URL` is unreachable.
- Check `curl http://localhost:3102/healthz` for the live config.

**Workshop scan returns 400 `invalid_body`**
- The scan endpoint requires either `humanId` (UUID) or `humanEmail` — not both, not neither.

**Wall page shows all factions at 0 parcels**
- Expected when no achievements have been redeemed yet. The leaderboard always renders all
  four factions for layout stability.

**Tick worker logs `failed for resident <id>` but the loop keeps going**
- This is by design — one bad row never kills the loop. Look at the error in the log;
  it's usually a malformed memory or an SQL constraint violation.

**Drizzle complains about a missing migration**
- After editing `packages/db/src/schema/`, you must run `bun run db:generate` before
  `bun run db:migrate`. The generate step writes the SQL diff to disk.

---

## Roadmap

Built today:
- ✅ Static catalog (factions, resources, achievements, standing tiers)
- ✅ Drizzle schema for 15 owned tables + read-only `users`/`sessions`
- ✅ Hono API: identity, factions, workshops scan, residents chat, achievements redeem, wall, print queue
- ✅ Tick worker: attention/lifespan decay, death archival
- ✅ Inference service: Vercel AI SDK over any OpenAI-compatible endpoint
- ✅ SvelteKit webapp: visitor dashboard, staff kiosk, wall display
- ✅ Auth shared with landing-2026 via cookie + DB
- ✅ Per-service Dockerfiles + prod docker-compose overlay
- ✅ Strict typecheck passes

Not yet built:
- ⏳ Visitor chat UI on `/dashboard/residents/:id` (data layer ready)
- ⏳ Achievements redemption UI on `/dashboard/achievements`
- ⏳ Library of Souls browsing UI
- ⏳ Visitor-spawned residents (schema ready; spawn endpoint missing)
- ⏳ LLM-driven epitaphs in the tick worker (templated for now)
- ⏳ Badge/ESP-NOW integration behind `humans.badge_id`
- ⏳ Wall display layout polish (parcels are scatter-random; want grid clustering by faction)
- ⏳ CI typecheck + drizzle dry-run on PRs

## License

Internal to Onion DAO. Not yet open-sourced.
