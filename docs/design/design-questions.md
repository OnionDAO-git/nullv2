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

- Lightweight participation: 1-3 Shards.
- Normal workshop: 5 Shards.
- Major win or staff/admin award: 10-20 Shards.

Question: what Shards-per-attendee-per-hour curve do we expect during the event?

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

## Questions For Later Phases

- When should device mechanical effects turn on?
- Should landmarks produce faction resources every tick, daily, or only when campaigns complete?
- Should visitor-born heroes be allowed to sponsor campaigns, or only flagships?
- Should hero death create campaign bonuses, memorial devices, or only letters/library entries?
- Should future sabotage be anonymous, public, or revealed by Locksmith-style investigation?
- Should Pokemon-style defenders become robotic agents, protocols, drones, or AI subagents?
