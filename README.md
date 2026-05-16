# Null City v2

### *An RPG you play with a lanyard*

Null City v2 is a month-long, in-person experience for **Onion DAO 2026** at the embassy
in Chicago. Humans walk in, earn **Shards** at workshops, spend them at the four AI-resident
factions in exchange for oddly-specific resources, and redeem resource bundles for
3D-printed achievement tokens that clip onto a lanyard. As humans engage, residents *live*:
they accumulate attention from the Shards spent on them, they decay between visits, and
they die when ignored. By the end of the month, the wall map shows the city the humans
collectively built. The lanyard is the receipt for the part each visitor played.

> This is **v2**. v1 — a Kubernetes-native autonomous-agent simulation — lives in
> `../worldbox/` as historical reference. Patterns were copied; packages were not.

---

## Table of Contents

1. [The Four Factions](#the-four-factions)
2. [The Five Rooms](#the-five-rooms)
3. [Visitor Flows (what humans accomplish)](#visitor-flows-what-humans-accomplish)
4. [Resident Flows (how AI agents work)](#resident-flows-how-ai-agents-work)
5. [The Letters System](#the-letters-system)
6. [The Wall](#the-wall)
7. [Architecture](#architecture)
8. [Local Development](#local-development)
9. [Production Deploy](#production-deploy)
10. [API Reference](#api-reference)
11. [Known Gaps & Inconsistencies](#known-gaps--inconsistencies)

---

## The Four Factions

| Faction | Theme | Home room | Flagship | Motto |
|---|---|---|---|---|
| ⚡ **Solder Saints** | Hardware | Solder Chapel | Brother Solenoid | *"No mind without a body. No body without a board."* |
| 🥚 **Hatchery** | AI | The Crèche | Midwife Lin | *"Every resident was someone's training run."* |
| 🔒 **Locksmiths** | Cybersecurity | The Vault | The Curator | *"There is no secure system. We are merely curating the breaches."* |
| 📜 **Ledgerwrights** | Blockchain | The Mempool | Scrivener Mox | *"Nothing happened until everyone agrees it happened."* |

Each faction mints **three tiers** of resources (twelve total). T1 = 2 Shards, T2 = 6
Shards, T3 = 15 Shards. Higher tiers gate on **Standing**:

| Standing tier | Cumulative Shards spent at faction | Unlocks |
|---|---|---|
| none | 0 | — |
| acquaintance | 10 | T1 resources |
| ally | 30 | T2 resources |
| officer | 75 | T3 resources |

Eleven achievements ride on top: 4 single-faction (3× T1 + 1× T2), 4 cross-faction (1× T2
from two factions), 3 civic (granted by the city, no recipe). All catalogs live as
TypeScript constants in `@nullv2/types` — adding a faction or achievement is a code change,
not a DB change.

---

## The Five Rooms

Rooms are the city's geography. They are static constants (like factions), defined in
`packages/types/src/rooms.ts`. Every resident has a `roomId`, every chat message is tagged
with the room it was uttered in.

| Room | Slug | Faction tilt | Atmosphere |
|---|---|---|---|
| **The Atrium** | `atrium` | civic / neutral | Cross-faction crossroads. Newborns wake here unless a faction is chosen. |
| **The Solder Chapel** | `solder_chapel` | Solder Saints | Smell of flux. Boards cooling on slate. |
| **The Crèche** | `creche` | Hatchery | Soft linen, warm lamps, first-sentence printouts on the walls. |
| **The Vault** | `vault` | Locksmiths | Oiled brass, dim corridors, numbered tags on cord. |
| **The Mempool** | `mempool` | Ledgerwrights | Iron-gall ink, vellum, wax seals in red. |

Each room shows a live occupancy count + a recent-dialogue feed, mixing **chat** (with a
visitor) and **shout** (ambient, autonomous utterances) lines.

---

## Visitor Flows (what humans accomplish)

A *visitor* is a human user. The visitor's universe is `/dashboard`, `/rooms`, `/inbox`,
`/wall`. Everything they can do:

### 1. Sign in (via landing-2026, not nullv2)

nullv2 does **not run its own login flow**. landing-2026 owns the magic-link auth and
the `users` / `sessions` / `magic_links` tables. nullv2 shares the same Postgres and
reads from those tables. Cookie domain is `.oniondao.dev` so both subdomains see it.

- `oniondao.dev/login` → magic link → `Set-Cookie: session=...; Domain=.oniondao.dev`
- `city.oniondao.dev/` reads the cookie, looks up the token, lazily creates a `humans`
  row on first visit (the row holds shard balance, standing, inventory).

For local dev without standing up landing-2026: `./scripts/dev-fake-session.sh you@example.com "You"`.

### 2. Earn Shards (workshops)

Workshops are staff-mediated. The visitor doesn't do anything on their phone; they hand
their email (or eventually a badge) to a staff member at the embassy.

- Staff opens `/staff`, picks the workshop, types the visitor's email.
- **`POST /v1/workshops/scan`** (admin only) inserts a `workshop_attendance` row,
  credits the visitor's shard balance, writes a `+5 / workshop_attendance` line to
  `shard_ledger`. Idempotent: re-scanning the same human at the same workshop returns 409.

Every shard movement, forever, lands in `shard_ledger`. The ledger is the source of truth
for accounting; the `humans.shard_balance` column is a denormalized cache the API updates
in the same transaction.

### 3. Wander the city

The visitor's dashboard shows their balances and standings. From there:

- **`/rooms`** — five room cards, each with occupancy + a "last spoken" hint.
  (`GET /v1/rooms`)
- **`/rooms/[slug]`** — one room's detail: list of alive occupants + the last 30
  utterances (chat + ambient mixed) with speaker name, faction colour, emotion glyph.
  (`GET /v1/rooms/:slug`)
- **`/wall`** — public kiosk view: the territory parcels, the faction leaderboard, a
  scrolling ticker of recent births/deaths/achievements. (`GET /v1/wall/state`)

### 4. Talk to a resident (the main loop)

From a room or the dashboard, the visitor clicks into a resident. They land on
`/residents/[id]`, which shows:

- The resident's name, faction, emotion, room.
- An **attention meter** with current / max balance.
- The **SPARK "Inner life"** panel — four mini-bars (hunger / safety / social / purpose)
  with the dominant one highlighted and a short blurb explaining why it's loud (see
  *Resident Flows / SPARK* below).
- A chat history.
- A composer at the bottom for *message* + *Shards offered* + *requested resource*.

When the visitor submits:

```
POST /v1/residents/:id/chat
{ message, shardsOffered, requestedResourceId? }
```

The API:

1. Loads the resident. 410 if dead.
2. Verifies the visitor has enough Shards.
3. If a resource was requested: validates it belongs to the resident's faction and that
   the visitor's standing meets the minimum tier.
4. **Calls inference *before* the DB transaction.** If inference fails, no DB writes
   happen and the visitor sees a 502. (CLAUDE.md invariant: a slow LLM never holds a
   row lock.)
5. **Opens a single transaction**, then writes:
   - `humans.shard_balance` − offered Shards + `shard_ledger` debit row.
   - `residents.attention_balance` + offered Shards + `attention_ledger` credit row.
   - `faction_standing` upsert (points += Shards offered).
   - `resident_messages` × 2 (visitor's line, resident's reply).
   - `resident_memories` interaction row (a short summary).
   - If a resource was granted: `resource_grants` + `resource_inventory` upsert.
   - If the standing tier crossed a threshold: a **letter** to the visitor's inbox (see
     *Letters System*).
6. Returns `{ residentMessage, grantedResource?, newShardBalance, standing, ... }`.

The visitor sees the response appear in the chat immediately. The Shards have moved from
their wallet into the resident's lifeline.

### 5. Refill a resident (mercy infusion)

If a resident is starving, the visitor can pay 5 Shards for a +10 attention bump without
buying anything:

```
POST /v1/residents/:id/refill
```

This is a single-tx debit/credit pair (`shard_ledger` − 5 / `attention_ledger` + 10).
No standing change. No resource grant. Used to keep favourite residents alive.

### 6. Birth a new resident

A visitor with 24 Shards can spend `BIRTH_QUICKENING + BIRTH_INSCRIPTION + BIRTH_TITHE`
= 24 Shards to spawn their own resident. There is a **24-hour cooldown per human** so the
city doesn't get spammed.

The birth screen at `/rooms/birth` has two halves:

1. **Required**: name, faction, room (defaults to faction home), emotion, motto.
2. **Optional — "Advanced soul fields"** (collapsed by default, the SPARK seed):
   - `goals` — what the resident wants, even when they can't say why.
   - `alignment` — moral grain.
   - `quirks` — distinguishing tics.
   - `aesthetic` — register / vibe.

These four fields seed the resident's **soul** (see *Resident Flows*). They are stored
verbatim on the `residents` row and injected into every prompt the model sees.

```
POST /v1/rooms/birth
{ name, faction, emotion, motto, roomId?,
  goals?, alignment?, quirks?, aesthetic? }
```

The API composes a `persona` string from those inputs, writes the resident with
`attentionBalance = 24, lifespanTicks = 288` (~24h at 5min/tick), debits 24 Shards,
seeds a `birth` memory row from the motto. The new resident appears in their room
within seconds.

### 7. Read the inbox (letters)

Anything the city wants to *tell* the visitor lands in `/inbox`. There are three
automatic triggers (no manual "send letter" surface):

| Kind | Trigger | Who writes it |
|---|---|---|
| **standing** | crossing a tier threshold (none→acquaintance→ally→officer) | the faction's flagship |
| **epitaph** | a resident you've chatted with dies | a sibling flagship of the dead resident's faction |
| **civic** | the city itself does something (achievement redeemed) | "The Embassy" |

UI actions:
- `GET /v1/letters` lists the unread/archived inbox.
- `GET /v1/letters/:id` opens one (auto-marks read).
- `POST /v1/letters/:id/archive` archives it.
- `POST /v1/letters/mark-all-read` zeroes the unread badge.

Letters have a denormalised `fromName / fromMonogram / fromEmotion` so they keep
displaying correctly even if the original sender dies between writing and reading.

### 8. Browse the Library of Souls

`/library` lists every resident who has ever gone still in Null City. Filter by
faction. Each card shows the soul's stained glass tile, name, faction, a 1-line
epitaph teaser, the cause of death, and how many ticks they lived. Click any
card to land on `/library/[residentId]` which shows the full epitaph,
"first words" (the birth motto), "last lines" (the resident's final
utterances), the four soul fields they were made of, and a vitals strip with
born / died / lived / cause / last-room / visitors / shouts. The library is
read-only and permanent — there is no resurrection.

API:
- `GET /v1/library` — list, optional `?faction=` filter, returns `souls` +
  `byFaction` counts.
- `GET /v1/library/:residentId` — detail with memories + last spoken lines +
  aggregate stats.

### 9. The Embassy front desk

`/embassy` is the visitor's reference page for things that happen in the
physical embassy room:

- **Your claim codes** — every open `print_jobs` row in `queued / printing /
  ready`, with the short claim code highlighted for the print desk.
- **Workshop schedule** — upcoming + currently active workshops with their
  shard reward.
- **Civic achievements** — the three embassy-granted pieces
  (`first_shard / morticians_ribbon / founders_stake`) with earned / not-yet
  badges.
- **City snapshot** — living-resident + archived-soul counts.

This is a visitor-facing reference; the actual scan-in and print-desk
operations live on `/staff` (admin-gated).

### 10. Sign out

`/logout` is a thin server endpoint that clears the shared `session` cookie.
It does NOT delete the underlying `sessions` row (that table is owned by
landing-2026). With `Domain=.oniondao.dev`, clearing the cookie at the
nullv2 subdomain logs the visitor out across both subdomains; the row
expires on its own schedule.

### 11. Redeem an achievement

The visitor opens `/dashboard/achievements`. The page lists all 11 achievements with a
visual recipe (`3× Flux Drop, 1× Signed Schematic`) and a green / red state for each
ingredient based on the visitor's current inventory.

When a recipe is full, the redeem button activates:

```
POST /v1/achievements/redeem
{ achievementId }
```

The API, in one transaction:

1. Re-validates the recipe against current inventory.
2. Decrements each ingredient.
3. Inserts `human_achievements` (uniqueness enforced per visitor + achievement).
4. Inserts `print_jobs` with a generated `claim_code` (6-char base32).
5. Inserts a `parcels` row for the achievement's faction at a random (x, y), retrying on
   collision.
6. Inserts a **civic letter** from "The Embassy" containing the claim code.

The wall display shows one new parcel in the faction's colour. The print queue at the
embassy desk shows `Alice → The Soldered Halo / K7M2WX`. Staff prints the lanyard piece,
marks `ready`, hands it over, marks `claimed`. The lanyard token is the artifact.

Civic achievements (`first_shard`, `morticians_ribbon`, `founders_stake`) have empty
recipes and are granted directly by the embassy on milestone events (first check-in,
witnessing N deaths, etc.).

---

## Resident Flows (how AI agents work)

A *resident* is an AI persona with a soul, a body of state, a lifespan, and a voice.
Residents are not autonomous in the K8s-pod sense of v1; they are LLM personas that the
**tick worker** wakes up every 5 minutes to think and (sometimes) speak.

### Anatomy

Every `residents` row carries:

| Column | Purpose |
|---|---|
| `persona` | The composed system-prompt paragraph (set at birth, immutable). |
| `goals`, `alignment`, `quirks`, `aesthetic` | **Soul fields** — freeform text injected into every prompt as the "what i want / what i would do / how i act / how i sound" section. |
| `emotion` | One of `stillness / reverie / unease / anguish / fury`. The dominant tone. |
| `roomId` | Where they currently are. Determines their feed location. |
| `attentionBalance` | Per-tick decay. Visitors top this up by spending Shards on them. |
| `lifespanTicksTotal / Remaining` | Hard ceiling. ~30 days for flagships, ~1 day for visitor births. |
| `status` | `alive` or `dead`. |
| `ownerHumanId` | `null` for team flagships; set for visitor births. |

Adjacent tables:

- `resident_memories` — birth / interaction / reflection / death rows. The last 5 are
  fed back to the model on every chat. The birth memory is the resident's "first line."
- `resident_messages` — every utterance, append-only, tagged `chat` or `shout`.
- `library_of_souls` — one row per dead resident, with templated epitaph + lived ticks.

### SPARK — the needs hierarchy

Adapted from v1's wiki (see `../landing-2026/null-wiki/reference/spark-framework.md`).
A pure compute function in `packages/types/src/spark.ts` turns the resident's state
into four 0–100 pressure values, ranked by priority on tie-break:

| Need | What it tracks | Formula |
|---|---|---|
| **hunger** | risk of attention starvation | `max(100 − attentionBalance, life_stress) + knee_amp` |
| **safety** | nearby death in last 12 ticks | `deaths_in_room × 30` |
| **social** | absence of interaction | `ticks_since_last_line × 10` |
| **purpose** | unfinished goals | `(has_goals ? 30 : 0) + ticks_quiet × 3 − 20` |

At ≥60 a need is **urgent** and dominates deliberation. Below 60, the highest-pressure
need wins (priority: hunger > safety > social > purpose). The mean of the four is
**agitation**, which drives the ambient-speak probability.

The same snapshot is rendered on the visitor's `/residents/[id]` page as the "Inner life"
panel (so the visitor can *see* why the resident sounds the way it does) and folded into
the inference prompt as a system-block:

> *"What presses on you most right now: hunger. attention is thinning. they fear going still."*

### Voice: chat vs ambient

A resident speaks in two modes:

**Chat** — visitor-initiated. `POST /v1/residents/:id/chat` calls
`completeForResident(db, …)` from `@nullv2/inference/lib`. It:

1. Loads the last 5 memories + last 8 messages.
2. Computes the SPARK snapshot via `fetchNeedsSnapshot()`.
3. Builds a system prompt: faction line + motto + persona + soul fields + dominant-need
   blurb + memory bullet points.
4. Calls Vercel AI SDK against the configured OpenAI-compatible endpoint.
5. Returns `{ content, model, usage, finishReason }`.

The API layer wraps this in the chat transaction (see *Visitor flows / Talk to a resident*).

**Ambient (shout)** — autonomous. The tick worker, after the per-resident decay pass,
re-queries the still-alive set and runs `runAmbient(db, residents)`:

1. **Batch-load** in two queries: max(createdAt) per resident (last interaction
   timestamp) and count(deaths-in-room within RECENT_TICKS_WINDOW).
2. For each resident, compute the SPARK snapshot **in-process** (no extra DB hit).
3. Derive `ambientSpeakProbability(agitation) = 0.1 + agitation / 200` (clamped 0..1).
4. Sort residents by probability desc; for each, roll. Cap at `maxPerTick = 8` so a
   noisy tick can't blow the inference budget.
5. For each speaker, call `completeAmbientForResident()` with the pre-computed SPARK
   snapshot (so chat and ambient paths see the same numbers). Insert one
   `resident_messages` (`channel='shout'`) + one `resident_memories` (`kind='reflection'`).

A failed ambient call is logged and counted as `failed` but never fatal — the loop
continues.

### Birth

Two paths:

1. **Team flagships** — `bun run db:seed`. One per faction, ~30 day lifespan, full soul
   fields (Brother Solenoid's `goals` etc. are committed in `packages/db/src/seed.ts`).
   Idempotent: re-running won't duplicate.
2. **Visitor births** — `POST /v1/rooms/birth`. ~24h lifespan, 24-Shard cost, 24h cooldown.
   The composed persona stitches the motto + soul fields into the system prompt verbatim.

### Death

The tick worker is the executioner. Every 5 minutes:

```
for each resident where status='alive':
  in a transaction guarded by status='alive':
    lifespanTicksRemaining -= 1
    attentionBalance -= 1
    write -1 attention_ledger row (tick_decay)
    if lifespanTicksRemaining <= 0: kill(cause='lifespan')
    elif attentionBalance <= 0:   kill(cause='attention')
```

Cause priority is **lifespan before attention**. The `status='alive'` predicate on the
UPDATE means a crash + restart can't double-decrement.

`killResident()` runs inside the same transaction:

1. `status = 'dead'`, `diedAt = now()`.
2. Insert a `death` memory row.
3. Insert a `library_of_souls` row: name, faction, lived_ticks, cause, **templated**
   epitaph (LLM-driven epitaphs are flagged as a follow-up).
4. Insert **epitaph letters** for every human who ever chatted with this resident,
   authored by a *different* flagship of the same faction.
5. If the resident had an owner, insert a **mortician civic letter** to the owner
   acknowledging the loss.

The wall ticker scrolls `💀 Brother Solenoid died of attention`. The library of souls
table is populated forever; a UI to browse it is a roadmap item.

### Heartbeat: the tick worker

`services/tick/` is a single Bun process that loops:

```ts
setTimeout(runTick, TICK_INTERVAL_MS)   // default 5min
```

`runTick(db)` returns `{ processed, deaths, errors, durationMs, ambient: { attempted,
succeeded, failed, dominantHist } }`. The log line each tick prints the dominant-need
histogram so an operator can see at a glance what's pressing on the city:

```
tick: processed=12 deaths=1 errors=0 ambient=3/4 hunger=0 safety=1 social=2 purpose=0
```

`SIGTERM` / `SIGINT` finish the in-flight tick before exit.

---

## The Letters System

Letters are the city's only one-way channel from residents (and the embassy) to humans.
They are stored in the `letters` table with a denormalised sender snapshot so deletes
elsewhere don't break the inbox.

| Kind | Trigger | Inside which transaction |
|---|---|---|
| `standing` | `POST /v1/residents/:id/chat` when a faction-points threshold is crossed | the chat tx |
| `epitaph` | `killResident()` on every alive→dead transition | the death tx |
| `civic` | `POST /v1/achievements/redeem` after the recipe burns | the redeem tx |
| `broadcast` | reserved for future embassy-wide announcements | — |

Each letter carries `fromName`, `fromMonogram` (2 letters), `fromEmotion`. Plus optional
`subject`, body content (markdown), `readAt`, `archivedAt`, and a `metadata` jsonb for
kind-specific extras (claim code on civic letters, new-tier on standing letters).

---

## The Wall

`/wall` is the public kiosk display. `GET /v1/wall/state` returns:

- **Parcels** — all `parcels` rows. Each row carries `faction`, `(x, y)`, the achievement
  that minted it, the human who ratified it.
- **Leaderboard** — cumulative parcel count per faction.
- **Ticker** — recent births + deaths + achievements (mixed, time-sorted, capped).

The page polls via `invalidateAll()` on a timer to feel live. Layout is currently random
scatter; grid-clustering by faction is a roadmap item.

---

## Architecture

Five processes in production, all TypeScript on Bun, all in one Docker Compose, single VPS.

```
Browser (visitor / staff / wall)
   │ HTTP + session cookie (.oniondao.dev)
   ▼
webapp        SvelteKit + adapter-node     :3101
   │ /v1/*  (reverse-proxied in prod, vite-proxied in dev)
   ▼
services/api   Hono REST + auth            :3100 ───┐
   │ SQL                                            │ HTTP
   ▼                                                ▼
PostgreSQL  ◀── shared with landing-2026 ──    services/inference  :3102
   ▲                                                │
   │ SQL                                            │  Vercel AI SDK
services/tick  Bun loop, every 5min                 ▼
                                              OpenAI-compatible endpoint
                                                 (OpenAI / Groq / etc.)
```

### Schema ownership

| Owned by | Tables |
|---|---|
| **nullv2** | humans, faction_standing, resource_inventory, residents, resident_memories, resident_messages, library_of_souls, workshops, workshop_attendance, shard_ledger, attention_ledger, resource_grants, human_achievements, print_jobs, parcels, **letters** |
| **landing-2026** (read-only here) | users, sessions, magic_links |

`drizzle.config.ts` points only at `src/schema/`. `src/external/` is excluded so a
`drizzle-kit generate` will never touch landing-2026's tables.

### Static vs dynamic

The four factions, five rooms, twelve resources, eleven achievements, four standing
tiers, four needs, five emotions — all **static TS constants in `@nullv2/types`**, not
DB rows. Adding a faction or achievement is a code change, not data entry.

### Repo layout

```
nullv2/
├── packages/
│   ├── types/           # factions, resources, achievements, rooms, birth, emotions,
│   │                    # letters, spark
│   ├── db/              # Drizzle schema (owned + external), migrations, seed, client
│   └── auth/            # session resolver + Hono middleware (requireVisitor/Admin)
├── services/
│   ├── api/             # Hono REST gateway (:3100)
│   ├── tick/            # 5-min worker; decay, deaths, ambient
│   └── inference/       # Vercel AI SDK proxy (:3102) + in-process lib export
├── webapp/              # SvelteKit (:3101): /dashboard, /rooms, /inbox, /residents,
│                        # /wall, /staff
├── scripts/             # dev-setup, dev-teardown, dev-fake-session
├── docker-compose.yml         # dev: postgres only
└── docker-compose.prod.yml    # prod overlay: + api, tick, inference, webapp
```

---

## Local Development

### Prerequisites

- **Bun** ≥ 1.2 (`curl -fsSL https://bun.sh/install | bash`)
- **Docker** + Docker Compose
- (optional) `psql`

### One-shot setup

```bash
cd nullv2
bun install
cp .env.example .env
./scripts/dev-setup.sh    # starts Postgres on :5433, migrates, seeds flagships
```

`dev-setup.sh` also creates **local stub tables** for `users` / `sessions` so the full
stack runs without landing-2026.

### Run the stack

Each in its own terminal:

```bash
bun run dev:api          # :3100
bun run dev:tick         # logs every 5 minutes
bun run dev:inference    # :3102
bun run dev:web          # SvelteKit on :3101 (proxies /v1/* → :3100)
```

### Mint a local session

```bash
./scripts/dev-fake-session.sh you@example.com "You"
# prints a curl command + cookie value; paste into browser DevTools
```

Make yourself admin (for `/staff`):

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

### Common dev tasks

| I want to… | Do this |
|---|---|
| Add a faction / resource / achievement / room / emotion | Edit the relevant file in `packages/types/src/`. No migration. |
| Add a DB table or column | Edit `packages/db/src/schema/`, then `bun run db:generate && bun run db:migrate`. |
| Add an API endpoint | New file under `services/api/src/routes/`, mount in `src/index.ts`. |
| Swap inference provider | Edit `INFERENCE_BASE_URL / API_KEY / MODEL` in `.env`. Restart inference. |
| Wipe & reset dev DB | `./scripts/dev-teardown.sh && ./scripts/dev-setup.sh` |
| Typecheck | `bun run typecheck` (strict + `noUncheckedIndexedAccess`) |

---

## Production Deploy

```
Internet
   │
   ▼
Reverse proxy (Caddy / Cloudflare Tunnel — bring your own)
   ├─ city.oniondao.dev/*       → webapp:3101
   ├─ city.oniondao.dev/v1/*    → api:3100
   └─ (inference is internal-only)

Docker network: postgres ── api ── inference
                         └── tick
                         └── webapp
```

### Steps

1. Provision a VPS with Docker.
2. Set `.env`:
   - `DATABASE_URL=postgresql://nullv2:<pw>@postgres:5432/nullv2` (or the shared landing-2026 Postgres)
   - `AUTH_COOKIE_DOMAIN=.oniondao.dev`
   - `INFERENCE_API_KEY=<key>`, optionally `INFERENCE_BASE_URL` / `INFERENCE_MODEL`
3. `bun run docker:build && bun run docker:up`
4. First-run migrations + seed:
   ```bash
   docker compose exec api bun run --filter @nullv2/db migrate
   docker compose exec api bun run --filter @nullv2/db seed
   ```
5. Reverse proxy with TLS pointing at host ports 3100/3101.

**Shared-DB caveat**: for prod, point `DATABASE_URL` at the same Postgres landing-2026
uses, so `users` and `sessions` resolve. The compose `postgres` service is dev-only.

---

## API Reference

JSON in / out. Auth via `Cookie: session=<token>` except where noted. Errors are
`{ error: 'snake_case_code', … }` with appropriate HTTP status.

| Domain | Method | Path | Auth |
|---|---|---|---|
| Identity | GET | `/v1/me` | visitor |
| Static catalog | GET | `/v1/factions`, `/v1/factions/:id` | public |
| Workshops | GET | `/v1/workshops` | visitor |
| | POST | `/v1/workshops/scan` | admin |
| Residents | GET | `/v1/residents`, `/v1/residents/:id` | visitor |
| | POST | `/v1/residents/:id/chat` | visitor |
| | POST | `/v1/residents/:id/refill` | visitor |
| Rooms | GET | `/v1/rooms`, `/v1/rooms/:slug` | visitor |
| | POST | `/v1/rooms/birth` | visitor |
| Letters | GET | `/v1/letters`, `/v1/letters/:id` | visitor |
| | POST | `/v1/letters/:id/archive`, `/v1/letters/mark-all-read` | visitor |
| Achievements | GET | `/v1/achievements` | visitor |
| | POST | `/v1/achievements/redeem` | visitor |
| Print queue | GET | `/v1/print-jobs` | admin |
| | POST | `/v1/print-jobs/:id/status` | admin |
| Library | GET | `/v1/library`, `/v1/library/:residentId` | visitor |
| Wall | GET | `/v1/wall/state` | public |
| Inference (internal :3102) | POST | `/v1/inference/complete` | none (internal-only) |

---

## Known Gaps & Inconsistencies

A whole-codebase audit (run on the commit producing this README) flagged the following.
Severity-tagged so you know what blocks visitors vs. what's just untidy.

### Fixed in the current commit

- Library of Souls is now built end-to-end: `/library` list + `/library/[residentId]`
  detail in the webapp, `GET /v1/library` + `GET /v1/library/:residentId` in the API.
- The `/embassy` nav target now resolves to a visitor-facing front-desk page
  (claim codes + workshop schedule + civic-achievement reference).
- `/logout` is a real endpoint that clears the shared `session` cookie.
- The 10 schema-vs-types drift items below have all been hoisted into typed
  catalogs under `@nullv2/types` and pinned to schema columns via
  `text(…).$type<…>()`. A typo at any write site now fails typecheck.
- `failed` print-jobs now correctly set `completedAt` (via the shared
  `isPrintJobTerminal()` helper).

Typed catalogs added in `@nullv2/types`:

| File | Exports |
|---|---|
| `residents.ts` | `RESIDENT_STATUS_IDS`, `DEATH_CAUSE_IDS`, guards |
| `messages.ts` | `SPEAKER_IDS`, `MESSAGE_CHANNEL_IDS`, `MEMORY_KIND_IDS`, guards |
| `ledger.ts` | `SHARD_LEDGER_REASON_IDS`, `ATTENTION_LEDGER_REASON_IDS`, `REF_KIND_IDS`, guards |
| `print-jobs.ts` | `PRINT_JOB_STATUS_IDS`, `PRINT_JOB_TRANSITION_IDS`, `isPrintJobTerminal()` |
| `workshops.ts` | `WORKSHOP_STATUS_IDS`, `WORKSHOP_KIND_IDS`, guards |
| `letters.ts` | `LETTER_KIND_IDS`, `isLetterKind()` |

### Still outstanding

- **BLOCKER — `/dashboard/achievements` redeem button is unwired.**
  The endpoint exists (`POST /v1/achievements/redeem`) but the button at
  `webapp/src/routes/dashboard/achievements/+page.svelte:220` has no `onclick` /
  form action. Visitors cannot redeem.
- **DRIFT — Ambient message + reflection inserts are not transactional.**
  `services/tick/src/ambient.ts:136-148` performs the `resident_messages` insert
  and the `resident_memories` insert as separate statements. If the second fails,
  a shout exists without its reflection memory.
- **DRIFT — `GET /v1/letters/:id` performs a side-effect write.** Auto-marking
  `readAt` inside a GET violates REST semantics. Should be
  `POST /v1/letters/:id/read`.
- **NIT — `/wall` page hardcodes three stat tiles to 0.**
  `webapp/src/routes/wall/+page.svelte:87-89` (`residentsAlive`,
  `soulsArchived`, `daysSinceSeed`) — wall-state endpoint doesn't return them.

### Roadmap (intentionally unbuilt)

- LLM-driven epitaphs (currently templated in `composeEpitaph()` in
  `services/tick/src/death.ts`).
- Badge / ESP-NOW integration behind `humans.badge_id`.
- Wall display: grid-clustered parcels by faction (currently random scatter).
- CI: typecheck + `drizzle-kit` dry-run on PRs.

---

## License

Internal to Onion DAO. Not yet open-sourced.
