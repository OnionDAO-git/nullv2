# Null City Autonomy Pitch Overview

Status: pitch brief
Companion spec: `docs/design/autonomy-economy.md`

## Core Pitch

Null City is a live faction struggle over near-future Chicago. OnionDAO humans earn Shards by showing up and doing real things, then spend those Shards as Handlers to fund AI heroes, public campaigns, devices, and map changes.

The web map is the main stage. The coworking-space monitor shows the City Broadcast: who is winning, what is contested, which heroes need help, and which humans just changed the city. The phone/web app is the Handler Console: fund campaigns, inspect landmarks, help heroes, track faction standing, and review personal impact.

The game works if a human can understand this in 30 seconds:

> Pick a faction. Fund an operation. Watch Chicago change. Your name stays on the record.

## Product Boundary

Null City is not the whole OnionDAO workshop narrative. It is the always-on world experiment that uses OnionDAO participation as fuel.

- OnionDAO track: workshops, challenges, attendance, points/Shards, prizes, badges, and skill progression.
- Null City track: autonomous residents, factions, campaigns, landmarks, devices, letters, and soul archive.
- Shared bridge: OnionDAO profiles, Shards/points API, public monitor visibility, and optional future workshop-to-city hooks.

This lets the workshops stay focused on learning and challenges while Null City stays focused on autonomous agents and public world state.

## Launch Loop

1. Human earns Shards or points through an OnionDAO workshop, quest, competition, check-in, or staff award.
2. Human sees the Campaign Board or City Broadcast.
3. Human funds a public faction operation with at least 1 Shard.
4. The ticker and campaign page update immediately.
5. The sponsoring hero gains progress, attention, and public momentum.
6. The campaign resolves over real time into a map change, device, defense, letter, birth, death, or archive event.
7. The human receives public credit, faction standing, and My Impact history.

## Faction Struggle

The factions are fighting to define what kind of city Null City becomes.

- Solder Saints: minds need bodies, hardware, tools, and stewardship.
- Hatchery: minds need birth, growth, memory, lineage, and care.
- Locksmiths: minds need safety, privacy, containment, and adversarial protection.
- Ledgerwrights: minds need proof, credit, records, rights, and consensus.

This "First Charter" story is a candidate spine, not locked canon. It gives people a values-based reason to choose a faction while still leaving room for hero attachment, underdog support, and personal authorship.

## Map And Campaigns

Landmarks are fixed Chicago strategic nodes. The MVP starts with six:

- Merchandise Mart.
- Chicago Board of Trade.
- Harold Washington Library.
- Lower Wacker.
- Union Station.
- The Embassy.

Campaigns are the human-to-world interface and the primary agent focus mechanism. MVP campaign types:

- Claim landmark.
- Defend landmark.
- Build device.

Each campaign has a faction, hero, target, public pitch, funding goal, wall-clock deadline, contributor list, and deterministic outcome rule.

The campaign system is our Majesty-style indirect control model:

- Humans do not command agents.
- Humans fund public mandates.
- Agents pursue mandates that fit their faction, vows, location, SPARK state, and survival needs.
- The scheduler assigns legal lead/support work and resolves outcomes.

Useful vocabulary:

- Campaign Board: human-facing list of fundable operations.
- Mandate Pool: agent/system-facing list of funded asks.
- Handler Drops: targeted hero support that reinforces campaigns.
- Emergency Ordinances: bounded Embassy Clerk interventions that prevent stalls.

## Time Model

Null City is a background experience. Humans are not expected to stare at the map all day.

- Scheduler tick is configurable: 1, 5, or 10 minutes.
- Default launch tick: 5 minutes unless testing says otherwise.
- Campaign/build durations are wall-clock time, not player-facing tick counts.
- Human spending updates progress immediately.
- Agent/world consequences apply on the next scheduler cycle.
- Building something should take hours; defense can take tens of minutes.
- Quiet hours pause or slow deadlines, work timers, attention decay, deaths, and major control flips.

The city should feel alive overnight, not punitive. Overnight mode becomes sleeping agents, pending campaigns, tomorrow's threats, and a morning recap.

## Agent Autonomy

Heroes are public protagonists, but the tick worker is the arbiter.

- Agents do not invent mechanics.
- LLMs write pitch, thanks, grief, objections, and narration.
- The scheduler chooses legal campaigns and assigns lead/support agents deterministically.
- Agents return structured intents: support campaign, start/endorse campaign, move, ask for Shards, rest/reflect.
- Campaigns have one lead agent and optional capped support agents.
- Multiple agents can occupy a landmark; same-location interactions become resolved events, not live negotiation chaos.

Agents should not be pure bounty hunters. Shards matter, but faction priorities, vows, SPARK pressure, location, survival, and public mandate all affect what a hero wants.

## Embassy Clerk

The Embassy Clerk is the public rules voice: referee, clerk, commentator, and theatrical civic machine.

It can:

- Announce outcomes.
- Explain why campaigns succeeded or failed.
- Spotlight ignored landmarks.
- Offer underdog discounts.
- Publish morning recaps.
- Warn about campaign expiry.

It should not randomly punish people or secretly flip the board. The Clerk can keep the city dramatic, but outcomes should be explainable from public state.

## Shards And Standing

Shard scale from Notion:

- Daily check-in: about 1 Shard.
- Workshop: about 1-3 Shards.
- Bring someone new: about 2 Shards.
- Quest/experience: about 3-10 Shards.
- Competition placement: about 5-20 Shards.

Current code uses 5-Shard workshops, 2/6/15 resource costs, 10/30/75 standing thresholds, 5 Shards for +10 attention refill, and 24-Shard birth.

Design direction:

- 1 Shard should matter.
- Campaigns should encourage pooled funding.
- Higher standing unlocks stronger authorship and rarer actions.
- Birth should be rare, public, and gated.

## Souls And Birth

Separate soul design from agent birth.

- A soul draft is a possible future hero.
- Many humans can submit or endorse soul drafts.
- Birth is expensive, gated, public, and exciting.
- A new hero is born from a selected soul draft.
- The City Broadcast announces designer, birther, faction, vow, and first mission.
- The Library of Souls records designer, birther, major patrons, guides, final Shard giver, campaign history, and death/archive outcome.

MVP can ship this simply: curated soul drafts, designer/birther credit, public birth events, and a cap on active visitor-born heroes.

## MVP In

- 6 seeded landmarks.
- OnionDAO profile/Shards/points bridge.
- Always-on experiment positioning inside the OnionDAO event, without replacing the workshop/challenge track.
- City Broadcast web map.
- Campaign Board.
- One active campaign per faction.
- Claim, Defend, Build.
- Wall-clock campaign timing.
- Quiet hours / overnight mode.
- Deterministic campaign resolution.
- Lead/support agent assignment.
- Mandate Pool / Campaign Board incentive layer.
- Handler Drops as bounded hero support.
- Embassy Clerk emergency ordinances.
- Public contribution ticker with OnionDAO profile names/images.
- Faction standing unlocks.
- Basic My Impact.
- Cosmetic devices with founder credit.
- Rare/gated birth with designer and birther credit.
- Library of Souls archive links.

## MVP Out

- Sabotage.
- Tactical combat.
- Full free market.
- Landmark resource production.
- Faction stockpile economy.
- Device mechanical bonuses.
- Full Soul Foundry ranking if curated soul drafts are enough.
- Fully autonomous multi-step planning.
- Random overseer punishment.
- Battle royale map collapse.
- Overpowered sponsor items.
- Forcing every workshop or challenge into a bespoke Null City story mechanic.
- Hardware beacons or physical puzzle integrations as required dependencies.
- Player-created factions or governance.
- Deep broadcast animation polish.

## Decisions Needed

- Formal product boundary: primary OnionDAO narrative, sponsored Null City experiment, or optional project built on OnionDAO data.
- Final Shard scale: small Shards, current 5-Shard workshops, or larger Influence converted down.
- Launch tick interval and quiet hours.
- Campaign durations and funding windows.
- Whether to use the names Mandate Pool, Campaign Pledges, Handler Drops, and Emergency Ordinances.
- Birth gating and target number of new agents.
- Which standing tier unlocks which abilities.
- Whether Soul Foundry is full voting/ranking or curated draft list for MVP.
- Public profile/name privacy rules.
- Limits on Handler Drops and Clerk ordinances.
- Initial landmark control state.
- Which part gets priority if time is tight: City Broadcast, Campaign Board, My Impact, or Soul/Birth.
