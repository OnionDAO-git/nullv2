# Null City Autonomy Design Questions

Status: open questions for human/product review
Companion spec: `docs/design/autonomy-economy.md`

## Blockers Before Implementation Planning

### 1. Launch Landmark Set

Default proposal:

- Merchandise Mart
- Chicago Board of Trade
- Harold Washington Library
- Lower Wacker
- Union Station
- The Embassy

Question: is a 6-landmark MVP enough, or should we seed 12 with some locked/unclaimable until later?

### 2. Initial Landmark Control

Default proposal: all landmarks start neutral except The Embassy, which is civic/neutral and unclaimable.

Question: should any faction start with a tilted or controlled landmark to create immediate rivalry?

### 3. Shard Faucet

Default proposal:

- Daily check-in: 1 Shard.
- Workshop: 1-3 Shards, or keep current code's 5-Shard workshop if we want a larger unit.
- Bring someone new: 2 Shards.
- Quest/experience: 3-10 Shards.
- Competition placement or major award: 5-20 Shards.

Question: are we using small Narrative V2 Shards, current code's 5-Shard workshops, or larger calendar-style Influence converted at roughly 10:1?

### 4. Handler Order Deferral

Default proposal: heroes can only defer a funded order for concrete rules: dead hero, campaign cap, invalid target, missing required resources once stockpiles exist, faction conflict, or Runway/Security emergency.

Question: should heroes ever refuse a valid funded order for personality/narrative reasons, or only defer for visible rule reasons?

### 5. MVP Device Types

Default proposal:

- Fabricator Node
- Compute Shrine
- Ledger Anchor

Question: are these the right three MVP devices, or should each faction have one named cosmetic device from day one?

### 6. Device Moderation

Default proposal: device name and inscription are free text but staff/admin can rename or hide bad entries; no generated images in MVP.

Question: do public wall inscriptions need approval before showing, or is after-the-fact moderation acceptable?

### 7. Campaign Refunds

Default proposal: expired campaigns refund 75% of contributed Shards and preserve public historical credit.

Question: should failed/expired campaigns refund at all, or should the cost be final but narratively rewarded?

### 8. Campaign Funding Granularity

Default proposal: 1 Shard minimum contribution, so first-time attendees can immediately participate after a workshop.

Question: should campaign contribution units be 1 Shard for accessibility or 2 Shards to align with T1 resource pricing?

### 9. Sabotage Timing

Default proposal: sabotage is out of the June 1 MVP.

Question: is launch-day constructive-only gameplay acceptable, with sabotage added after claim/defend/build has live balance data?

### 10. Landmark Control And Parcels

Default proposal: landmark control and achievement parcel placement stay separate for MVP. Parcels remain visual receipts; landmarks are strategic nodes.

Question: should landmark control influence parcel placement/color clustering immediately, or stay separate until the wall layout is redesigned?

### 11. Human Role Language

Default proposal: `Handler` is the primary role. `Patron`, `Founder`, `Witness`, and `Operator` are credit labels. `Saboteur` can become a post-MVP credit label if sabotage ships.

Question: should faction dialogue use "Handler" consistently, or use softer terms like Patron/Sponsor when a hero is thanking a human?

### 12. Story Spine

Default proposal: treat "The First Charter" as a candidate frame, not final canon. The factions are fighting to define what makes AI life legitimate enough to protect, and each controlled Chicago landmark becomes a civic signature for one faction's vision.

Question: is this empathetic and concrete enough for attendees, or do we need a sharper external crisis, villain, countdown, or personal hero-centered story for the launch experience?

### 13. Public Display Priority

Default proposal: the coworking-space monitor should be the City Broadcast, cycling between map, active campaign spotlight, faction momentum, agent watchlist, live ticker, and recent consequences. The phone app should be the Handler Console where people fund campaigns and inspect their personal impact.

Question: for June 1, should we prioritize the room-scale monitor drama, the phone action flow, or a balanced minimum version of both?

### 14. Public Name And Privacy Rules

Default proposal: public ticker and plaques use visitor display names or handles when available, with staff/admin ability to hide or rename bad entries.

Question: do attendees need an explicit opt-out or pseudonym flow before their contributions appear on the public monitor?

### 15. Faction Standing Unlocks

Default proposal: keep current thresholds as a starting point: acquaintance at 10 Shards, ally at 30, officer at 75. Use standing for more than resource access: campaign preference, device inscription, patron credit, stronger faction influence, and rare birth eligibility.

Question: which actions should unlock at each standing tier for the June 1 experience?

### 16. Agent Birth Cost And Gating

Default proposal: agent birth should be rare, public, and exciting. The current 24-Shard cost is probably too low/common for inference and cast-management, and too fragile because a newborn has only about 2 hours of attention under current decay. Birth should require high standing, a larger Shard spend, staff/admin blessing, a group campaign, an achievement, or some combination.

Question: what is the intended launch rate for new agents: zero/manual only, a few per day, or a small capped number over the whole event?

### 17. Soul Foundry

Default proposal: separate soul design from agent birth. Any human can submit a soul draft; humans can vote/endorse; high-ranked or curated souls become eligible for rare public birth. The soul archive records designer, birther, voters/supporters, major patrons, final Shard giver, and campaign history.

Question: should Soul Foundry voting/ranking ship in MVP, or should MVP use a simpler curated list of human-created souls with designer/birther credit?

### 18. Simulation Tempo

Default proposal: use a configurable scheduler tick with 5 minutes as the launch default. Store campaign deadlines and build durations as wall-clock timestamps. Human contributions update immediately; agent/world consequences apply on scheduler cycles.

Question: should launch default be 1, 5, or 10 minutes, and how fast should monitor drama update compared with world resolution?

### 19. Quiet Hours

Default proposal: configure America/Chicago quiet hours, for example 10 PM-9 AM. During quiet hours, campaign deadlines/work timers pause or slow, attention decay pauses or slows, and major control flips/deaths/expiries wait until morning unless admins override.

Question: should quiet hours fully pause the game, slow it down, or allow funding while pausing only negative outcomes?

### 20. Campaign Durations

Default proposal:

- Claim: 1-3 hour funding window, 30-90 minute work duration.
- Defend: 30-90 minute funding window, 15-45 minute work duration.
- Build device: 2-6 hour funding window, 2-8 hour work duration.
- Birth: campaign/event gated, immediate public ceremony after unlocked.

Question: are these durations right for a background coworking/event experience?

### 21. Agent Campaign Assignment

Default proposal: campaigns have one lead agent and optional capped support agents. The tick worker assigns lead/support deterministically based on faction, human funding, SPARK fit, vow/goals, location, workload, and flagship priority. Agents explain the decision but do not race or bid for ownership in MVP.

Question: should campaign ownership be deterministic lead/support assignment, human-chosen lead agent, or a more autonomous agent competition later?

### 22. Mandate Vocabulary

Default proposal: use Campaign Board for humans and Mandate Pool for the system/agent-facing set of funded asks. Use Campaign Pledges for Shards attached to public operations.

Question: do these names feel clear enough, or should we use simpler language everywhere?

### 23. Handler Drops

Default proposal: Handler Drops are targeted hero support that reinforces campaigns: refill/runway support, public endorsement, briefing note, or campaign-linked support. Avoid instant tactical overrides in MVP.

Question: which Handler Drops should ship first, and what caps prevent one wealthy human from turning them into direct control?

### 24. Emergency Ordinances

Default proposal: the Embassy Clerk can issue bounded public interventions such as underdog discounts, ignored-landmark spotlights, morning dockets, permit expiry warnings, and calls for witnesses. No random punishment, unexplained hazards, or board-flips in MVP.

Question: which ordinances make the city more dramatic without feeling unfair?

## Questions For Later Phases

- When should device mechanical effects turn on?
- Should landmarks produce faction resources every tick, daily, or only when campaigns complete?
- Should hero death create campaign bonuses, memorial devices, or only letters/library entries?
- Should future sabotage be anonymous, public, or revealed by Locksmith-style investigation?
- Should Pokemon-style defenders become robotic agents, protocols, drones, or AI subagents?
- Should a later season add a more aggressive overseer mode, shrinking map, or hazard events once the civic campaign loop is stable?
