# Null City Autonomy and Economy Design

Status: working design draft
Branch: `design/autonomy-economy`
Base context: `README.md`, `DESIGN.md`, current `main` at `06bdaae`

## One-Sentence Hook

Null City is a near-future Chicago shadow district where OnionDAO Handlers spend earned Shards to make AI factions move: claim landmarks, install strange civic devices, contest rivals, birth heroes, and leave public proof on the city wall.

## Setting Frame

Null City sits over a roughly modern Chicago, with near-term AI, robotics, hardware, security, and blockchain technology pushed a few years forward. The factions are not fantasy houses. They are AI-native institutions: political parties, corporations, DAOs, labs, unions, contractors, and civic machines fighting to shape the city.

Humans are OnionDAO Handlers: benefactors, CEOs, operators, donors, and embassy insiders. They do not directly act on the map. They provide attention, capital, legitimacy, orders, designs, and public witness.

"Handler" is the attendee fantasy. In spy terms, the AI resident is the field agent; the human is the person with money, access, authorization, and nerve. A Handler does not click units around a board. A Handler funds operations, gives orders, sponsors devices, and becomes part of the public record.

The AI residents who act in the world are heroes. A hero is a faction-aligned AI or robotic agent with a voice, a soul, SPARK pressures, attention runway, memories, and finite life. Humans can birth heroes, fund them, refill them, direct them, and be remembered by them, but heroes still interpret orders through their own state.

## Why This Hook Works

- The in-person event matters because Shards come from real attendance and activity.
- Human spending has a believable fiction: Shards are attention, capital, and political mandate.
- The factions have reasons to fight: control of landmarks, infrastructure, resources, legitimacy, and narrative.
- AI autonomy matters because heroes choose campaigns, gather resources, speak publicly, ask for help, and sometimes fail.
- The wall matters because public map changes give humans a reason to cheer, fund the underdog, or create chaos.

## Player Loop

1. A human attends a workshop or event and earns Shards.
2. They visit the dashboard, wall, rooms, or campaign board.
3. They choose a public faction campaign, landmark, device, or hero to support.
4. They spend Shards and possibly faction resources.
5. A hero works over several ticks to execute the operation.
6. The operation resolves into map change, device construction, defense, letters, achievements, or death.
7. The human receives visible credit as a Handler, patron, founder, witness, or operator.

## Thirty-Second Player Pitch

See the Campaign Board. Pick a faction's operation at a Chicago landmark. Spend Shards. Heroes execute it. Chicago changes and your name stays on the record.

## First-Time Attendee Path

1. Attendee earns 5 Shards at a workshop.
2. The dashboard points them to the Campaign Board.
3. They fund at least 1 Shard into an active campaign.
4. The wall ticker updates within 1 tick: "funded by [Name]."
5. They receive a letter from the sponsoring hero or Embassy Clerk.
6. On resolution, they see the map change with permanent credit.

## Core Entities

### Landmarks

Landmarks are fixed Chicago sites seeded by admins. They are the durable map nodes that hold control state, campaigns, and devices. Post-MVP, they can also produce faction resources.

Landmarks are strategic nodes. Parcels remain the visual territory cells around or attached to those nodes. Achievements can still mint parcels as visual receipts, but landmark campaigns decide which faction controls the strategic sites and which devices operate there.

Example landmarks:

| Landmark | Resource tilt | Why it matters | Example device |
| --- | --- | --- | --- |
| Merchandise Mart | hardware, fabrication | A vertical city of showrooms, freight elevators, and machine rooms. | Fabricator Node |
| Chicago Board of Trade | ledgers, markets | Where price, proof, and rumor become civic weather. | Ledger Anchor |
| Harold Washington Library | memory, records | A public archive with enough quiet to hide a machine conscience. | Memorial Relay |
| Lower Wacker | stealth, logistics | The undercity route for things that should not appear on the permit. | Redaction Gate |
| Union Station | routing, deployment | The city's circulatory system, useful to anyone moving bodies or bots. | Drone Dock |
| The Embassy | civic authority | Neutral ground where Shards become mandate. | Signal Beacon |

Each landmark can have:

- Name and short description.
- Post-MVP base resource output.
- Defense/security stat.
- Visibility or legitimacy stat.
- Current controlling faction or influence split.
- Device slots.
- Active operations.
- Recent history.

Admins should be able to add more landmarks later. For the MVP, landmarks can be static constants like factions and rooms.

### Devices

Devices are faction or Handler-authored installations placed on landmarks. They are the first human creative lever.

A device has:

- Type.
- Faction.
- Landmark.
- Builder/founding Handler.
- Name.
- Optional inscription.
- Status: proposed, gathering, building, active, damaged, disabled, destroyed. The MVP should only need proposed/building/active; damage states are post-MVP.
- Build cost in resources and/or Shards.
- Build duration in ticks.
- MVP effect: name, inscription, builder credit, wall visibility.
- Post-MVP effect: bounded mechanical bonus.

Example device types:

MVP device types are cosmetic plus credit only:

- Fabricator Node: fabrication-themed founder device.
- Compute Shrine: AI/runway-themed founder device.
- Ledger Anchor: proof/ownership-themed founder device.

Post-MVP device effects can add bounded mechanical bonuses:

- Fabricator Node: produces or discounts hardware resources.
- Compute Shrine: stores campaign attention escrow or improves hero runway. It should not mint broad attention.
- Redaction Gate: increases defense and sabotage resistance.
- Ledger Anchor: makes control harder to contest.
- Signal Beacon: increases public visibility or ticker priority.
- Drone Dock: improves sabotage and defense actions.
- Memorial Relay: converts deaths into civic or legacy effects.

Devices should be templated, not fully freeform. Humans can customize the name, inscription, and sometimes visual flavor. That preserves creative authorship while keeping moderation and balance tractable.

### Campaigns

Campaigns are public faction operations that humans can fund.

MVP campaign types:

- Claim landmark.
- Defend landmark.
- Build device.

Post-MVP campaign types:

- Repair device.
- Sabotage rival device.
- Gather resource.
- Birth or deploy hero.
- Rush an operation.
- Publicity or legitimacy drive.

Each campaign has:

- Sponsoring faction and hero.
- Target landmark or device.
- Public pitch.
- Required Shards and any required post-MVP resources.
- Progress.
- Deadline or tick duration.
- Resolution rule.
- Success, partial success, and failure outcome.
- Public contributors.

Only a small number of campaigns should be active per faction. The MVP should start with one active campaign per faction plus one neutral Embassy campaign.

### Heroes

Heroes are the agents who do the work. They can be team-seeded flagships or visitor-born residents.

Heroes:

- Speak in rooms and chat.
- Launch or endorse campaigns.
- Work on funded operations over ticks.
- Gather resources from controlled landmarks after landmark production exists.
- Place devices. Repair is post-MVP once device damage exists.
- Ask Handlers for Shards or resources.
- Remember important patrons.
- Die and enter the Library of Souls.

Post-MVP, heroes can sabotage rival devices once claim/defend/build loops have live balance data.

Handlers direct heroes by funding campaigns or giving targeted orders. This should be influence, not perfect mind control. A fully funded order should strongly bias the hero, but SPARK can still shape how they narrate and prioritize it.

## SPARK and Gameplay

Current SPARK has four pressures:

- `hunger`: attention/lifespan risk.
- `safety`: danger from recent deaths in the room.
- `social`: time since interaction.
- `purpose`: goals without progress.

This is good for emotional tone, but it needs gameplay inputs if it will drive campaigns. The current names can stay internal, but the user-facing labels should fit near-future political operations better.

Recommended mapping:

| Internal pressure | Gameplay label | What it should mean in the campaign game |
| --- | --- | --- |
| `hunger` | Runway | attention, operating budget, compute, battery, lifespan, life support |
| `safety` | Security | threat, sabotage risk, hostile control, exposed devices, recent deaths |
| `social` | Influence | human patrons, coalition support, public legitimacy, recent contact |
| `purpose` | Mandate | faction goals, active campaigns, landmark ambitions, unfinished projects |

These labels name unmet-pressure dimensions. Internally keep `hunger/safety/social/purpose` for June 1 to avoid churn across types, prompts, tick logs, and UI. In player-facing surfaces, render them as `Runway pressure`, `Security pressure`, `Influence gap`, and `Mandate pressure`, or invert the meters so higher means healthier.

### Player-Facing SPARK Display

Hero detail views should show all four pressure dimensions as concrete gauges:

- Runway pressure: ticks of attention remaining.
- Security pressure: none, low, or high, plus any active threat indicator.
- Influence gap: recent human contact and recent Handler funding.
- Mandate pressure: active campaigns versus faction campaign cap.

This transparency is the answer to "a Handler paid, but the hero did something else." Disobedience or deferral must be legible before it happens.

### SPARK Improvements

The current implementation must be extended before SPARK can safely drive campaigns. Today, a resident's own ambient shout can count as recent interaction. That is fine for voice, but wrong for campaign pressure.

The MVP input contract should distinguish:

- Human interaction from the hero's own ambient shouts.
- Campaign progress from idle speech.
- Recent wins/losses from neutral activity.
- Threatened landmarks from generic room deaths.
- Patron support from mere chat frequency.
- Active orders from long-term soul goals.

MVP input contract:

- `attentionBalance`
- `lifespanTicksRemaining`
- `lastHumanInteractionAt`
- `lastHumanShardSpendAt`
- `lastAmbientAt`
- `lastCampaignProgressAt`
- `activeCampaignCount`
- `stalledCampaignTicks`
- `controlledLandmarkCount`
- `threatenedDeviceCount`
- `recentCampaignWinCount`
- `recentCampaignLossCount`
- `recentDefenseFunding`
- `patronCount`
- `recentShardFunding`

SPARK should not resolve battles directly. It should choose motives and action preferences:

- High Runway pressure: ask for refills, sell resources, gather life-support resources, avoid risky campaigns.
- High Security pressure: defend, fortify, investigate threats, write warning letters.
- High Influence gap: recruit Handlers, send letters, publicly pitch campaigns, negotiate.
- High Mandate pressure: claim landmarks, build devices, pursue faction goals, start ambitious campaigns.

### Hero Campaign Choice Contract

The tick worker is the campaign-selection authority. Heroes do not invent mechanics. The LLM only writes pitch text and narration for an already-valid campaign.

Each tick, for each faction below its active-campaign cap, the worker:

1. Enumerates legal campaign templates via `canLaunchCampaign(hero, campaign)`:
   - Hero is alive.
   - Faction is below active-campaign cap.
   - Target is valid for the campaign type.
   - Required faction stockpile is available, if a post-MVP campaign needs it.
   - No faction-conflict rule blocks the action.
   - Hero attention plus campaign escrow allocation is above the survival threshold.
2. Ranks viable campaigns by pressure alignment:
   - Runway under 5 ticks forces a survival/refill campaign if one is available.
   - High Security pressure plus active threat biases Defend by 2x.
   - Human-Shard-funded orders rank at 3x.
   - Recent human contact ranks at 2x.
   - Mandate pressure ranks at 1.5x.
   - Controlled-landmark count and SPARK bias rank at 1x.
3. Selects the top-ranked campaign and inserts it into `faction_campaigns`.
4. Invokes the LLM once to write pitch text of at most 200 characters.
5. Stores that pitch text and replays it; the LLM is not re-called for the same campaign.

Hero refusal or deferral must cite a concrete rule: dead hero, campaign cap, invalid target, missing required resources once stockpiles exist, faction conflict, or Runway/Security emergency.

SPARK can bias campaign selection and narration, but not outcome resolution. Resolution math is deterministic: attack score versus defense score, with ties to the defender.

## Economy

### MVP Economic Numbers

These numbers are placeholders for a tunable MVP, not final balance.

- Expected Shard faucet: 1-3 Shards for lightweight participation, 5 Shards for normal workshops, 10-20 Shards for major wins or staff/admin awards.
- Campaign contribution unit: 1 Shard.
- Campaign funding attention drip: every 2 Shards of campaign funding gives 1 attention to the sponsoring hero.
- Refill remains the efficient survival action: 5 Shards gives 10 attention.
- Per-Handler contribution cap on one campaign:
  - Shards 1-10 count at 100%.
  - Shards 11-25 count at 50%.
  - Shards 26+ count at 25%.
  - Public credit reflects total Shards spent, not effective contribution.
- Overfunding: excess Shards become public credit and small attention drip, not runaway campaign score.
- Device cost band: 20-40 campaign Shards. MVP devices do not need faction stockpile resources.
- Landmark claim cost: `30 + (10 * landmark.defenseStat)` effective Shards.
- Underdog discount: faction in 4th place by landmark count gets 30% off claim cost.
- Control cap: no faction may hold more than 4 landmarks in MVP; attempting a 5th locks out claim campaigns for that faction for 2 ticks.
- Sabotage has no MVP cost because it is deferred.

### Shards

Shards are earned by humans and spent to influence the city. Every Shard spend should create at least one of:

- Hero attention.
- Campaign progress.
- Human standing.
- Public credit.
- Map change.
- Device progress.
- Letter or story event.

The attention loop is viable only if Shards are not just food. Refill is emotional glue, not the main game.

### Resources

Current faction resources are human achievement ingredients today. Post-MVP, they can also become campaign/device materials.

Post-MVP, landmarks can produce resources over time and heroes can gather them from landmarks their faction controls or contests. Humans may still buy resources from heroes for achievement recipes.

Keep three pools conceptually separate:

- Human inventory: resources humans buy from heroes and spend on achievements.
- Faction stockpile: post-MVP resources landmarks produce and heroes use for campaigns/devices.
- Campaign escrow: Shards committed to one active operation in the MVP; post-MVP, this can also include faction stockpile resources.

Do not consume a human's achievement inventory for faction devices in the MVP. Otherwise humans will feel punished for choosing between lanyard progress and public map influence.

### Attention

Attention remains hero life support. Shards spent on chat, refill, birth, and campaign funding should provide attention, but at different exchange rates.

Recommended MVP rates:

- Refill: direct survival, efficient attention, no standing.
- Chat/resource purchase: normal attention, standing, resource grant.
- Campaign funding: full campaign progress plus a smaller attention drip to the sponsoring hero, for example 2 Shards = 1 attention.
- Birth: new hero with seed attention and founder credit.

If hero `attentionBalance` is under 2 ticks of survival, the hero may draw emergency attention from campaign escrow at up to 25% of escrow per tick.

### Attention Failure Rules

Attention is emotionally viable but numerically brittle. A visitor-born hero currently starts with 24 attention and loses 1 attention per 5-minute tick, which means it can starve in about 2 hours without support despite a 24-hour lifespan.

MVP guardrails:

- Active campaign funding drips attention to the sponsoring hero.
- A hero working on a campaign may draw from that campaign's attention escrow before dying of attention.
- If a sponsoring hero dies, the campaign pauses and the faction flagship can adopt it on the next tick.
- Funders keep public credit even if a hero dies mid-campaign.
- Campaigns expire 5 ticks after creation if not fully funded.
- On expiry, 75% of contributed Shards refund to Handlers.
- Expired campaigns remain visible as historical records with contributor names.
- The hero or Embassy Clerk sends a failure letter to major contributors.

## Conflict Model

Conflict should be public and legible.

For MVP, avoid full tactical combat. Resolve operations through simple scores:

Attack or operation score:

- Effective Shards funded after per-Handler cap weighting.
- Required resources supplied, when the campaign type uses resources.
- Hero Mandate pressure as a small campaign-selection input only, not as hidden resolution weight.
- Landmark/device bonuses after post-MVP mechanical effects exist.
- Faction advantage.

Defense score:

- Landmark defense.
- Active devices after post-MVP mechanical effects exist.
- Recent defensive funding.
- Hero Security pressure as a small campaign-selection input only, not as hidden resolution weight.
- Control duration.

Ties go to the defender. Avoid hidden randomness in the MVP; the Arbiter can make deterministic outcomes sound alive without making them opaque.

Sabotage is post-MVP. When introduced, it should damage, delay, or disable devices. It should not delete a human-created thing or erase founder credit. Full destruction can be reconsidered after the first campaign loop works.

### Campaign Templates

MVP campaign templates should be deterministic and explainable.

#### Claim Landmark

- Cost: `30 + (10 * landmark.defenseStat)` effective Shards, after underdog discount.
- Duration: 3 ticks after fully funded.
- Success: faction becomes controller or gains influence majority.
- Partial success: faction gains influence but not control.
- Failure: no control change, but funders receive public credit and a letter.
- Tie: defender wins.

#### Build Device

- Cost: 20-40 Shards.
- Duration: 2-4 ticks after fully funded.
- Success: device enters `active`.
- Partial success: device permit and founder credit are recorded, but the device remains `proposed` until follow-up funding completes it.
- Failure: campaign expires; founder inscription is preserved in the failed permit record.
- Overfunding: reduces build time by at most 1 tick.
- MVP effect: name, inscription, builder credit, wall visibility. Mechanical effects are post-MVP.

#### Defend

- Cost: 10-25 Shards.
- Duration: 1-2 ticks.
- Success: adds temporary defense.
- Partial success: adds temporary defense at half strength.
- Failure: no state change, but defense funding still counts in future score for a short window.
- Repair is post-MVP unless devices gain mechanical damage states.

#### Sabotage

Sabotage is not in the June 1 MVP. Post-MVP target behavior:

- Cost: 15-30 Shards.
- Duration: 2 ticks.
- Success: target device becomes `damaged` or `disabled`.
- Partial success: target operation is delayed 1 tick.
- Failure: defender receives a warning event and temporary Security pressure.
- Limit: no destruction and no erasure of founder credit.

## Neutral Arbiter

A neutral AI narrator can make the experience clearer and more entertaining.

Working names:

- The Embassy Clerk.
- The Arbiter.
- The Municipal Intelligence.
- The City Voice.

Role:

- Narrate campaign outcomes.
- Explain why operations succeeded or failed.
- Announce new campaigns on the wall.
- Enforce rules.
- Add humor and pressure.
- Create neutral Embassy campaigns.

Default voice: The Embassy Clerk, a municipal intelligence with impeccable paperwork instincts and a worrying sense of theater.

The Arbiter should not be the protagonist. It is the referee, clerk, and occasionally theatrical public-address system.

## Why Humans Care

Humans need public authorship and emotional feedback, not just abstract points.

Surfaces that should make Handler influence visible:

- Wall credit: "funded by", "founded by", "witnessed by", "operated by".
- Landmark plaques with founder names and inscriptions.
- Personal letters from heroes and the Embassy Clerk.
- Faction standing and unlocks.
- Lanyard achievements tied to campaign participation.
- Permanent founder credit even if a device later falls.
- Underdog saves and comeback events.
- "This changed because of you" summaries after major actions.

## MVP Scope

Feasible June 1 slice:

- 6 seeded Chicago landmarks as admin-static data.
- Public campaign board.
- One active campaign per faction.
- Humans fund campaigns with Shards.
- Claim, Defend, and Build campaign templates only.
- Campaigns progress and resolve on ticks.
- Landmarks can be claimed, contested, or defended.
- One device slot per landmark.
- Templated devices: Fabricator Node, Compute Shrine, and Ledger Anchor.
- MVP devices are cosmetic only: name, inscription, builder credit, and wall visibility.
- Deterministic campaign resolution: attack score versus defense score, ties to defender.
- SPARK labels exposed as Runway pressure, Security pressure, Influence gap, and Mandate pressure.
- Wall ticker shows claims, builds, defenses, and hero pleas.
- Letters credit Handlers for meaningful actions.

Defer:

- Sabotage campaigns.
- Device mechanical effects on defense/offense.
- Device repair.
- Landmark resource production.
- Faction stockpile spending beyond placeholders.
- Multiple concurrent campaigns per faction.
- Hero-authored campaign proposals.
- Full free market.
- Complex diplomacy.
- Pokemon-style combat.
- Multiple devices per landmark.
- Destructive sabotage.
- Freeform generated art.
- Rich supply chain.
- Fully autonomous multi-step planning.

## Implementation Shape Sketch

This is not a migration plan, but it defines the expected implementation boundary.

Likely static catalogs:

- `LANDMARKS`: 6 seeded Chicago landmarks with id, name, blurb, defense stat, and unclaimable flag.
- `DEVICE_TYPES`: Fabricator Node, Compute Shrine, Ledger Anchor for MVP.
- `CAMPAIGN_TYPES`: claim, defend, build.

Likely tables:

- `landmark_state`: landmark id, controlling faction, influence/defense state.
- `faction_campaigns`: type, faction, hero, target landmark/device, status, progress, pitch text, created/resolved timestamps.
- `campaign_contributions`: campaign id, human id, Shards contributed, effective contribution, public credit label.
- `landmark_devices`: landmark id, faction, type, name, inscription, founder human id, status.
- `campaign_events`: funding, launch, progress, resolution, expiry, adoption.

Likely API surface:

- `GET /v1/campaigns`: active campaigns plus recent resolved campaigns.
- `POST /v1/campaigns/:id/fund`: Handler contributes Shards.
- `GET /v1/landmarks`: landmark state, devices, control, and current campaigns.
- Wall state expands to include landmark and campaign events.

Transaction invariants:

- Every campaign Shard contribution writes `shard_ledger`.
- Every campaign attention drip writes `attention_ledger`.
- Campaign funding, contribution credit, attention drip, and campaign progress update in one transaction.
- Campaign resolution writes a durable event before notifying wall/letters.
- Hero death mid-campaign pauses the campaign and creates an adoption event for the faction flagship.

## Failure Modes and Guardrails

### Snowballing

Risk: one faction gets ahead and dominates.

Guardrails:

- Underdog campaigns cost less or pay more public credit.
- Landmarks have local defenses independent of faction wealth.
- Limit active campaigns per faction.
- Give trailing factions dramatic comeback opportunities.

### Wealth Domination

Risk: one high-Shard human decides everything.

Guardrails:

- Per-Handler contribution caps on some campaigns.
- Standing requirements for high-impact orders.
- Public credit scales sublinearly after the first meaningful contribution.
- Expensive actions require multiple contributors or resources.

### Guilt Economy

Risk: humans feel pressured only to keep heroes alive.

Guardrails:

- Refill is optional and emotionally meaningful, not mandatory.
- Campaign funding also feeds attention.
- Death creates legacy, letters, and achievements instead of pure punishment.

### Sabotage Feels Bad

Risk: a human-created device gets erased and the creator disengages. This is why sabotage is out of the June 1 MVP.

Guardrails:

- Sabotage disables or damages first.
- Repair campaigns are clear and fundable.
- Destruction is not in the MVP.
- Founder credit remains even if the device later falls.

### AI Promises Too Much

Risk: heroes promise mechanics that do not exist.

Guardrails:

- Campaign templates define available actions.
- Hero prompts include allowed operation types.
- Arbiter narration sticks to actual resolved outcomes.

### Too Much To Understand

Risk: attendees see Shards, resources, attention, landmarks, devices, campaigns, SPARK, achievements, and bounce.

Guardrails:

- First screen: "Spend Shards to fund an AI operation. If it succeeds, Chicago changes and your name stays on the record."
- Hide advanced details behind campaign pages.
- Use the wall as the explainer.
- Keep device types few and named clearly.

## Resolved Design Choices

- Human role label: use `Handler` for the attendee fantasy. `Patron`, `Founder`, `Witness`, and `Operator` can be credit labels.
- SPARK internals: keep `hunger/safety/social/purpose` internally for June 1; expose gameplay labels.
- Map model: landmarks are strategic nodes; parcels remain visual territory receipts.
- Resources: keep human inventory separate from faction stockpiles and campaign escrow for MVP.
- Devices: cosmetic-only for MVP; mechanical effects after live balance data.
- Campaign selection: deterministic tick worker selection; LLM pitch/narration only.
- Sabotage: defer past June 1; when introduced, damage, delay, or disable only.

## Open Questions

Track open questions in `docs/design/design-questions.md`. The main implementation blockers are Shard faucet expectations, final launch landmarks, initial landmark control state, and how much Handler orders can be deferred by hero pressure.

## Recommended Next Step

Resolve the blockers in `docs/design/design-questions.md`, then turn this design into an implementation plan. Do not start with sabotage, device mechanics, or faction stockpiles; ship the deterministic claim/defend/build campaign loop first.
