# AI Review Prompt: Null City Autonomy and Economy

Use this prompt when asking another AI or agent to review the autonomy/economy design.

## Setup

Clone or update the repo and check out the design branch:

```bash
git clone https://github.com/OnionDAO-git/nullv2.git
cd nullv2
git fetch origin
git switch design/autonomy-economy || git switch -c design/autonomy-economy origin/design/autonomy-economy
git pull --ff-only origin design/autonomy-economy
```

If the branch is not yet on the remote, ask the maintainer to push `design/autonomy-economy`.

Read these files first:

1. `README.md`
2. `DESIGN.md`
3. `AGENTS.md`
4. `docs/design/autonomy-economy.md`
5. `docs/design/design-notes.md`
6. `docs/design/design-questions.md`
7. `docs/design/pitch-overview.md`

For current implementation details, inspect:

- `packages/types/src/spark.ts`
- `packages/types/src/birth.ts`
- `packages/types/src/resources.ts`
- `packages/types/src/rooms.ts`
- `packages/db/src/schema/residents.ts`
- `packages/db/src/schema/parcels.ts`
- `packages/db/src/schema/economy.ts`
- `services/tick/src/ambient.ts`
- `services/tick/src/tick.ts`
- `services/api/src/routes/residents.ts`
- `services/api/src/routes/rooms.ts`
- `services/api/src/routes/achievements.ts`
- `services/api/src/routes/wall.ts`

## Review Task

Critically review `docs/design/autonomy-economy.md`. Do not implement code unless explicitly asked. Produce a concise review with:

1. The strongest parts of the hook and gameplay loop.
2. The weakest or most confusing parts.
3. Feasibility assessment for a June 1 MVP.
4. Whether the two-track boundary works: OnionDAO workshops/challenges generate profiles and Shards/points, while Null City runs as an always-on world experiment consuming those signals.
5. Risks to the human-to-attention loop.
6. Risks to faction campaign balance.
7. How SPARK should be renamed, extended, or kept stable.
8. Whether "OnionDAO Handlers" is the right human role label.
9. Whether fixed Chicago landmarks plus devices are a strong enough map mechanic.
10. Whether the City Broadcast monitor and Handler Console phone surfaces make the faction struggle compelling and actionable.
11. Whether Shard earning/spending numbers create a tight loop for drop-ins, active participants, and power users.
12. Whether faction standing unlocks and Soul Foundry/birth gating are compelling without overloading the MVP.
13. Whether the simulation tempo, quiet hours, and campaign durations fit a background coworking/event experience.
14. Whether campaign lead/support assignment keeps AI autonomy legible without overbuilding multi-agent planning.
15. Whether Majesty-style incentives, Handler Drops, Mandate Pool, and Embassy Clerk ordinances improve the loop without turning Null City into a combat arena.
16. Edge cases not covered in the design.
17. Specific changes you recommend to the design doc before implementation planning.

## Viewpoints

Analyze from at least three viewpoints:

- Event attendee/player: is this understandable and motivating in 30 seconds?
- Event organizer: does the OnionDAO/Null City boundary reduce scope without making the city feel disconnected?
- Game economy designer: can Shards, resources, devices, campaigns, and attention coexist without stalling or snowballing?
- AI autonomy engineer: can SPARK realistically drive useful behavior without unpredictable LLM promises?
- Narrative designer: does near-future Chicago plus AI factions plus OnionDAO Handlers feel coherent and compelling?
- Implementation engineer: what is the smallest safe slice that can ship by June 1?

## Constraints

- Current stack is Bun, Hono, Drizzle, PostgreSQL, SvelteKit, and a tick worker.
- Current code already has residents, rooms, birth, attention decay, refill, chat, ambient shouts, resources, achievements, parcels, letters, and Library of Souls.
- Avoid proposing full tactical combat, free markets, or complex multi-agent diplomacy for the MVP.
- Prefer public faction campaigns, fixed landmarks, and simple device effects.
- Do not require bespoke hardware, cybersecurity, blockchain, or AI workshop integrations for the Null City MVP; treat those as optional future bridges.
- Assume this is an in-person OnionDAO event in Chicago.

## Output Format

Use this structure:

```md
# Review

## Verdict

## What Works

## Major Risks

## SPARK Recommendations

## Human Role / Hook

## Economy and Balance

## Implementation Scope

## Concrete Doc Edits
```

Keep the review direct, specific, and skeptical. If something sounds exciting but unbuildable, say so.
