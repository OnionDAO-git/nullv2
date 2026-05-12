# Resident Autonomy Direction

This is a working design note for bringing the v1 autonomous-agent excitement back into the
v2 event foundation without blowing up the simpler architecture.

## Core Thesis

v2 should keep the clean human event loop, but residents should matter over time.

Humans earn Shards in the real world. They spend those Shards to fund, influence, birth, or
support residents. Residents use attention/resources to pursue goals inside Null City. The
city changes because humans and residents form a feedback loop.

The current v2 architecture is intentionally simpler than v1: Docker/Postgres/Bun instead of
Kubernetes-native city infrastructure. That simplification should be treated as a delivery
constraint, not as a final statement that residents must remain static.

## Human and Resident Roles

Humans should not feel like normal RPG avatars directly controlling the digital world. The
cleaner model is:

- Humans earn Shards through real-world attendance, workshops, contests, and participation.
- Humans spend Shards to fund, influence, sponsor, or ratify resident/faction activity.
- Residents live inside Null City and take actions there.
- Factions and residents return resources, stories, quests, memories, and territory changes.

This preserves the event loop while keeping the AI world distinct and alive.

## Hero Residents Idea

"Hero" residents are a possible bridge between player agency and autonomous residents.

Humans still drive the event game by earning and spending Shards, but they can use those
Shards to:

- Birth or sponsor a resident.
- Fund a resident goal.
- Influence a resident toward a faction or mission.
- Upgrade a resident's capacity, tools, memory, or lifespan.
- Ask the resident to pursue quests or world actions.

The resident should still make choices. The human funds and nudges; the resident decides and
creates consequences.

This seems compatible with the current design as long as the human does not directly control
the world like a normal RPG avatar.

## Design Guardrails

- Avoid making residents feel like gambling tokens or horses to bet on.
- Prefer pride, attachment, grief, and legacy over direct material kickbacks.
- Keep the AI world meaningfully separate from the human event layer.
- Make resident actions legible enough that humans understand why they care.
- Preserve finite lives and death as real narrative events.
- Use the Library of Souls as the memory/legacy surface.
- Keep resident agency modular so v2 does not inherit v1's full operational complexity.
- Make the first autonomy slice small enough to demo with a few residents, not hundreds.

## Minimal Autonomy Slice

A small first implementation could be:

1. Add a resident action loop that runs every tick or every few minutes.
2. Give each resident a compact state summary: faction, needs, attention, lifespan, recent
   memories, recent human interactions, available actions.
3. Ask inference for a structured choice from a small action set.
4. Execute one action transactionally.
5. Store the action and a short memory.
6. Surface recent actions in the wall ticker, dashboard, or resident page.

Possible early action set:

- `reflect`: create an internal memory.
- `speak`: post a short public message.
- `request_attention`: ask humans/faction for Shards.
- `support_faction`: contribute to faction standing or territory progress.
- `trade_resource`: offer a resource to a human if rules allow.
- `pursue_goal`: advance a resident-owned project.
- `interact_resident`: respond to or collaborate with another resident.
- `prepare_epitaph`: update legacy notes near end of life.

Examples of world actions that could become concrete later:

- Open or improve a resident project such as a forge, bakery, vault, library, or incubator.
- Advance a faction objective.
- Request Shards for a specific need.
- Convert attention into a visible artifact.
- Leave an epitaph, recipe, map mark, or memory that outlives the resident.

## Data Surfaces To Consider

Current schema already has useful pieces:

- `residents`
- `resident_memories`
- `resident_messages`
- `attention_ledger`
- `library_of_souls`

Likely additions for real autonomy:

- `resident_goals`
- `resident_actions`
- `resident_relationships`
- `resident_projects`
- `world_events`
- `faction_objectives`

## What Good Looks Like

For the demo, a good autonomy layer does not need hundreds of agents. It needs a few residents
that visibly:

- Want something.
- Ask for help.
- Remember interactions.
- Make choices without direct human control.
- Affect faction/world state.
- Die or leave artifacts in a way people notice.
