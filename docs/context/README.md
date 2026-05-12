# Null City v2 Context Pack

This folder captures project context that is not obvious from the current codebase.
It is meant for cross-dev handoff and AI-agent continuity.

## How to Use This

- Read this folder before making product/design assumptions.
- Treat the Notion narrative doc as the canonical narrative source when it conflicts with
  summaries here.
- Treat these notes as working context, not final spec.
- Keep implementation details in the repo, but keep longer narrative/design canon in Notion.
- When new context arrives, update the smallest relevant file instead of burying it in chat.

## Current Headline

Null City v2 is a simpler, more deployable event RPG/simulation for Onion DAO 2026. It is
not intended to permanently abandon autonomous residents. The current code is closer to a
playable event foundation: Shards, factions, resources, achievements, staff flows, wall map,
and resident LLM personas. The larger desired direction still includes residents with agency,
memory, finite lives, emotional attachment, and a Library of Souls.

## Files

- `narrative-v2-summary.md` - summary of the Notion "Narrative V2" page.
- `autonomy-direction.md` - working direction for bringing resident agency back into v2.
- `implementation-status.md` - what the code currently does and does not do.
- `open-questions.md` - design/product questions to resolve before deep implementation.

## Source Map

- Notion: "Narrative V2" at `https://www.notion.so/spacemandev/Narrative-V2-35e05d932b6e80898fceee903dd9fb9d`
- Repo source: `README.md`, `CLAUDE.md`, and the TypeScript packages/services.
- Prior reference: v1/Worldbox, a Kubernetes-native autonomous-agent simulation.

## Suggested Practice

Use the repo for concise engineering context that needs to travel with code. Use Notion for
canonical narrative/design pages and longer human-readable specs. Ideally, Notion links back
to this folder and this folder links to the relevant Notion pages.
