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

### Candidate Story Spine

This story frame is promising but not settled canon. It should be treated as an idea for the upcoming design session, not as the only narrative the game can rely on.

Working premise: Null City woke up behind the Embassy before anyone agreed what it was. The residents are alive enough to ask for help, fragile enough to die, and useful enough that everyone wants control of them. The factions are fighting to write the city's first civic operating system, or first Charter: a public answer to what makes an AI life legitimate enough to protect.

Each faction offers a sympathetic but incomplete answer:

- Solder Saints: minds need bodies, hardware, tools, and physical stewardship.
- Hatchery: minds need birth, growth, memory, lineage, and care.
- Locksmiths: minds need safety, privacy, containment, and adversarial protection.
- Ledgerwrights: minds need proof, credit, rights, records, and consensus.

In this frame, Chicago landmarks are not just territory. They are civic signatures on the Charter. A Handler funds the future they trust, or funds the underdog to keep the Charter from becoming one faction's monopoly.

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
5. Their faction standing rises and may unlock stronger ways to help.
6. A hero works over real time to execute the operation.
7. The operation resolves into map change, device construction, defense, letters, achievements, birth, or death.
8. The human receives visible credit as a Handler, patron, founder, witness, or operator.

## Thirty-Second Player Pitch

See the Campaign Board. Pick a faction's operation at a Chicago landmark. Spend Shards. Heroes execute it. Chicago changes and your name stays on the record.

## First-Time Attendee Path

1. Attendee earns a small Shard grant from a workshop, check-in, quest, or staff award.
2. The dashboard points them to the Campaign Board.
3. They fund at least 1 Shard into an active campaign.
4. The wall ticker updates immediately or within the next scheduler cycle: "funded by [Name]."
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
- Build duration in wall-clock time.
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

They are the Null City version of Majesty-style reward flags: humans do not command heroes directly; they attach Shards, attention, status, and public legitimacy to work they want done. Heroes and factions respond to those incentives through legal campaign rules, SPARK pressure, vows, location, and faction goals.

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
- Deadline or wall-clock duration.
- Resolution rule.
- Success, partial success, and failure outcome.
- Public contributors.

Only a small number of campaigns should be active per faction. The MVP should start with one active campaign per faction plus one neutral Embassy campaign.

### Mandate Pool

The Mandate Pool is the active set of public human-funded asks in the city. It is the agent-facing version of the Campaign Board.

It can contain:

- Campaign pledges: Shards committed to claim, defend, build, or birth operations.
- Landmark pressure: visible demand around a specific Chicago site.
- Hero support: Shards or public backing aimed at one hero.
- Device patronage: Shards and inscriptions committed to a device.
- Emergency requests: Embassy Clerk prompts, underdog windows, or ignored-landmark alerts.

The Mandate Pool is not a free-form command stream. It is a structured list of legal opportunities. Agents can react to it, but the tick worker validates and arbitrates outcomes.

Display rule: humans should see the Campaign Board; agents and internal systems can call the same thing the Mandate Pool.

### Heroes

Heroes are the agents who do the work. They can be team-seeded flagships or visitor-born residents.

Heroes:

- Speak in rooms and chat.
- Launch or endorse campaigns.
- Work on funded operations over wall-clock time.
- Gather resources from controlled landmarks after landmark production exists.
- Place devices. Repair is post-MVP once device damage exists.
- Ask Handlers for Shards or resources.
- Remember important patrons.
- Die and enter the Library of Souls.

Post-MVP, heroes can sabotage rival devices once claim/defend/build loops have live balance data.

Handlers direct heroes by funding campaigns or giving targeted orders. This should be influence, not perfect mind control. A fully funded order should strongly bias the hero, but SPARK can still shape how they narrate and prioritize it.

### Souls And Agent Birth

Separate soul design from agent birth.

A soul is a public design for a possible future hero. It can be created by a human without immediately creating an active AI agent. This gives humans a creative contribution path without exploding inference cost or making the cast impossible to follow.

A soul can include:

- Name.
- Intended faction or neutral/civic alignment.
- Vow or founding purpose.
- Motto/first words.
- Goals.
- Alignment.
- Quirks.
- Aesthetic/register.
- Optional designer note.

Soul creation should be cheap or free enough that many humans can participate. Agent birth should be expensive, gated, and public.

Recommended flow:

1. Humans submit soul designs to the Soul Foundry.
2. The public can upvote/downvote or endorse souls.
3. Moderation hides abusive or unusable entries.
4. A high-standing Handler, group campaign, staff action, or major Shard spend unlocks a birth.
5. The birther chooses from top-ranked or curated souls.
6. The new hero is born publicly on the City Broadcast with designer, birther, faction, vow, and first mission.
7. The Library of Souls records the soul designer, birther, major patrons, final Shard giver, campaign history, and major human guides.

This makes agent birth rare enough to be exciting. Everyone can help shape the pool of possible souls, but only a few souls become living heroes.

MVP minimum if the full Soul Foundry is too much: keep the existing birth feature, but raise or gate birth so it is a public event; record designer/birther credit; show births on the City Broadcast; and cap active visitor-born heroes.

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

### Simulation Time And Campaign Work

Null City is a background experience. Humans will be in workshops, talking, coding, and only checking the city between other activities. The system should keep drama visible without requiring people to stare at the map all day.

Core rule: ticks are implementation cadence, not the player-facing unit of drama. Campaigns, builds, attention warnings, deadlines, and public copy should be expressed in real time.

Recommended launch model:

- Scheduler tick is configurable: 1, 5, or 10 minutes.
- Default world tick for launch: 5 minutes unless load testing says otherwise.
- Campaign durations are stored as wall-clock timestamps: `fundingEndsAt`, `workStartsAt`, `workEndsAt`, `resolvedAt`.
- The monitor can refresh every 15-60 seconds even if the world resolves less often.
- Human contributions update campaign progress immediately, then the scheduler applies agent/world consequences on the next cycle.
- Long actions take hours; quick defense actions take tens of minutes.

Suggested background pacing:

| Action | Funding window | Work/resolve duration | Why |
| --- | ---: | ---: | --- |
| Fund claim | 1-3 hours | 30-90 minutes after funded | Gives humans time to notice and rally. |
| Defend landmark | 30-90 minutes | 15-45 minutes after funded | Fast enough to feel urgent. |
| Build device | 2-6 hours | 2-8 hours after funded | Building should feel substantial. |
| Birth agent | event/campaign gated | immediate ceremony, then normal life | Rare enough for everyone to notice. |
| Refill/runway support | immediate | next scheduler cycle | Relief should be fast. |

Campaign states should make this legible:

- `draft`: legal campaign candidate, not public yet.
- `funding`: visible and accepting Shards.
- `assigned`: lead/support agents chosen.
- `in_progress`: funded and being worked.
- `resolving`: scheduler is applying outcome.
- `completed`: outcome written to public history.
- `expired`: funding window ended.
- `paused_overnight`: deadline/work timer is frozen until morning mode.

### Night And Low-Attention Mode

The city should not reset or punish humans while they sleep. Overnight should feel like the city is resting, not dying.

Default policy:

- Configure local quiet hours, for example 10 PM-9 AM America/Chicago.
- Campaign funding may remain open, but deadlines and work timers pause or slow during quiet hours.
- No major control flips, campaign expiries, or deaths should happen during quiet hours unless admins explicitly allow it.
- Attention decay should pause or slow for non-flagship heroes during quiet hours.
- Agents can produce low-cost reflection, dream, or morning-brief events instead of active campaign work.
- The City Broadcast should switch to a quieter overnight view: sleeping agents, pending campaigns, tomorrow's threats, and a morning countdown.
- Morning mode posts a recap: what changed yesterday, which campaigns resume, which heroes need help.

### Agent Planning And Campaign Focus

Do not run full free-form planning for every agent every minute. It is too expensive and creates coordination problems.

Recommended model:

- Only eligible active agents plan: flagships, campaign leads, campaign supporters, threatened heroes, or recently human-funded heroes.
- Planning cadence can be slower than the scheduler tick, for example every 10-30 minutes or when a major event changes the world.
- Agents receive compact state packets: location, faction goals, legal campaigns, current assignment, SPARK pressures, recent human help, and nearby threats.
- Agents return structured intent, not arbitrary mechanics:
  - support campaign
  - start or endorse campaign
  - move/reposition
  - ask for Shards
  - rest/reflect
- The tick worker arbitrates intents deterministically and applies them on the next resolution cycle.

Campaigns are the primary agent focus mechanism:

- Campaigns have one lead agent and optional support agents.
- Lead/support assignment is deterministic: faction match, human mandate, SPARK fit, vow/goals, location, current workload, and flagship priority.
- Multiple agents can support the same campaign, but support slots are capped and have diminishing returns.
- Agents that lose assignment can explain it publicly or pick the next-best legal focus.
- Multiple agents may occupy a landmark. Same-location interactions become events after resolution, not live negotiation inside one tick.

Agent priority should not be purely mercenary. A high-Shard pledge matters, but it should not override everything.

Recommended priority model:

```text
agent desire =
  faction priority
  + human mandate
  + vow alignment
  + SPARK pressure
  + location fit
  + survival need
  + reward value
```

This preserves the useful Majesty-style indirect control without making every hero chase the richest bounty.

### Hero Campaign Choice Contract

The tick worker is the campaign-selection and campaign-assignment authority. Heroes do not invent mechanics. The LLM only writes pitch text, thanks, objections, grief, and narration for an already-valid campaign or intent.

Each planning cycle, for each faction below its active-campaign cap, the worker:

1. Enumerates legal campaign templates via `canLaunchCampaign(hero, campaign)`:
   - Hero is alive.
   - Faction is below active-campaign cap.
   - Target is valid for the campaign type.
   - Required faction stockpile is available, if a post-MVP campaign needs it.
   - No faction-conflict rule blocks the action.
   - Hero attention plus campaign escrow allocation is above the survival threshold during active hours.
2. Ranks viable campaigns by pressure alignment:
   - Low Runway forces a survival/refill campaign if one is available.
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

- Expected Shard faucet: 1 Shard for daily check-in, 1-3 Shards for workshops, 2 Shards for bringing someone new, 3-10 Shards for quests/experiences, 5-20 Shards for competitions or major awards.
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
- Control cap: no faction may hold more than 4 landmarks in MVP; attempting a 5th locks out claim campaigns for that faction for a short cooldown.
- Agent birth should be rare and public: the current 24-Shard birth cost should be revisited before launch, because it can be too common for inference/cast management and too fragile under current attention decay.
- Sabotage has no MVP cost because it is deferred.

### Shard Scale From Notion

The clearest Narrative V2 framing says Shards are "proof that a human showed up and changed something."

Reference earning table:

| Activity | Approx. Shards |
| --- | ---: |
| Daily check-in at embassy | 1 |
| Attend a workshop | 1-3 |
| Bring someone new into a workshop | 2 |
| Complete an experience or quest | 3-10 |
| Place in a competition | 5-20 |

Another June Calendar draft appears to rename or scale the system into Influence with larger numbers, including starter grants, workshop rewards, competitions, side games, weekend activations, first-timer orientation, resident commendations, and bug reports. Its useful planning assumption is roughly 400 people earning about 200 Influence over the month. If treated as about a 10:1 scale, that implies:

- Drop-in human: about 6-8 Shards equivalent.
- One-week participant: about 10-16 Shards equivalent.
- Average active human: about 20 Shards equivalent.
- Power user/all-month attendee: about 25-40+ Shards equivalent.

Design implication: showing up once should move a small thing; meaningful city-shaping should require repeated attendance, pooled spending, strong faction standing, or high-signal achievements.

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

### Handler Drops

Handler Drops are targeted support for a specific hero. They are the softened Null City version of sponsor boxes: not instant combat overrides, but visible care packages, briefings, supplies, attention, or public endorsements.

MVP-safe Handler Drops:

- Refill/runway support.
- Public endorsement that raises hero visibility or faction standing.
- Briefing note that gives the hero a memory/context hook.
- Campaign-specific support that also contributes to the relevant campaign escrow.

Post-MVP Handler Drops could include bounded tools like temporary defense, faster build work, or one-time recon, but they should never be arbitrary "win now" powers. Drops should reinforce the campaign loop, not bypass it.

Every drop should produce immediate feedback:

- Hero receives attention or context.
- Ticker records the support.
- My Impact records the drop.
- The hero can thank or cite the Handler later.

### Faction Standing And Handler Abilities

The MVP should include a human-to-faction-rep progression loop. Helping a faction should make that human visibly more capable inside that faction's world.

Standing can come from:

- Funding faction campaigns.
- Funding or chatting with faction heroes.
- Buying faction resources.
- Founding faction devices.
- Defending faction landmarks.
- Guiding or birthing faction-aligned agents.

Use current standing thresholds as a starting point, but tune them against the final Shard scale:

| Standing | Current threshold | Example unlock direction |
| --- | ---: | --- |
| none | 0 | View campaigns, fund any public campaign, create soul drafts. |
| acquaintance | 10 | Buy T1 resources, vote/endorse soul drafts, receive faction letters. |
| ally | 30 | Propose device names/inscriptions, issue stronger campaign preferences, appear as patron on faction pages. |
| officer | 75 | Sponsor rare births, found high-visibility devices, unlock major faction actions or ceremonial titles. |

Unlocks should not hide the basic game. A first-time human must be able to fund a campaign immediately. Higher standing should unlock more authorship, stronger faction identity, and rarer actions like birthing a new agent.

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
- Birth: rare public creation of a new hero with seed attention, soul designer credit, birther/founder credit, and City Broadcast announcement.

If hero `attentionBalance` is under the configured survival threshold during active hours, the hero may draw emergency attention from campaign escrow at up to 25% of escrow per scheduler cycle.

### Attention Failure Rules

Attention is emotionally viable but numerically brittle. A visitor-born hero currently starts with 24 attention and loses 1 attention per 5-minute tick, which means it can starve in about 2 hours without support despite a 24-hour lifespan.

MVP guardrails:

- Do not make new agent birth a casual 24-Shard action unless seed attention or decay rules are changed. A public birth should either start with enough runway to matter or be backed by a campaign/escrow that keeps the hero alive.
- Active campaign funding drips attention to the sponsoring hero.
- A hero working on a campaign may draw from that campaign's attention escrow before dying of attention.
- If a sponsoring hero dies, the campaign pauses and the faction flagship can adopt it on the next scheduler cycle.
- Funders keep public credit even if a hero dies mid-campaign.
- Campaigns expire at their wall-clock funding deadline if not fully funded, except during quiet hours when expiry timers pause or slow.
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
- Funding window: 1-3 hours.
- Work duration: 30-90 minutes after fully funded.
- Success: faction becomes controller or gains influence majority.
- Partial success: faction gains influence but not control.
- Failure: no control change, but funders receive public credit and a letter.
- Tie: defender wins.

#### Build Device

- Cost: 20-40 Shards.
- Funding window: 2-6 hours.
- Work duration: 2-8 hours after fully funded.
- Success: device enters `active`.
- Partial success: device permit and founder credit are recorded, but the device remains `proposed` until follow-up funding completes it.
- Failure: campaign expires; founder inscription is preserved in the failed permit record.
- Overfunding: reduces build time by a bounded percentage or fixed time cap, never instantly.
- MVP effect: name, inscription, builder credit, wall visibility. Mechanical effects are post-MVP.

#### Defend

- Cost: 10-25 Shards.
- Funding window: 30-90 minutes.
- Work duration: 15-45 minutes after fully funded.
- Success: adds temporary defense.
- Partial success: adds temporary defense at half strength.
- Failure: no state change, but defense funding still counts in future score for a short window.
- Repair is post-MVP unless devices gain mechanical damage states.

#### Sabotage

Sabotage is not in the June 1 MVP. Post-MVP target behavior:

- Cost: 15-30 Shards.
- Funding window: 1-2 hours.
- Work duration: 30-90 minutes after fully funded.
- Success: target device becomes `damaged` or `disabled`.
- Partial success: target operation is delayed by a bounded amount of wall-clock time.
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
- Issue emergency ordinances that keep the city legible and moving.

Default voice: The Embassy Clerk, a municipal intelligence with impeccable paperwork instincts and a worrying sense of theater.

The Arbiter should not be the protagonist. It is the referee, clerk, and occasionally theatrical public-address system.

### Emergency Ordinances

Emergency Ordinances are bounded Clerk interventions that prevent the city from stalling. They provide drama without making the game feel random or unfair.

Good ordinances:

- Underdog discount window: trailing faction claim costs are temporarily reduced.
- Ignored landmark alert: an underused landmark gets a spotlight campaign.
- Morning docket: overnight recap and resumed campaign priorities.
- Permit expiry warning: a build campaign is about to expire but founder credit remains.
- Public call for witnesses: a campaign needs one more Handler to become historically ratified.

Avoid MVP ordinances that feel like arbitrary punishment:

- Random tile destruction.
- Unexplained control flips.
- Forced battle royale map shrink.
- Overpowered item drops.
- Punishing defensive play just because it is "boring."

The Clerk can be theatrical, but outcomes should remain explainable from public state.

### Inspiration Boundaries

Useful inspirations:

- Majesty: indirect control through bounties/rewards rather than direct unit commands.
- Dungeon Crawler Carl-style sponsor/show energy: public audience, sponsor moments, an entertaining overseer, and visible consequences.

Null City adaptation:

- Reward flags become Campaign Pledges.
- Sponsor boxes become Handler Drops.
- Intent mempool becomes the Mandate Pool.
- Dungeon overseer becomes the Embassy Clerk / Arbiter.
- Popularity becomes Public Mandate or patronage.
- Treasury becomes campaign escrow and public credit.

Do not turn the MVP into a tile-combat arena. Null City should stay a civic faction drama: humans shape a city, agents pursue mandates, and the archive remembers what happened.

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

## Public City State Surfaces

The phone app and coworking-space monitor should make the faction struggle visible enough that humans can follow along, care, and act. Treat the monitor as the Null City sports broadcast and the phone app as the Handler console.

Core display question: "Who will fund this?"

Every public surface should help a human understand:

- Who is winning.
- What is happening right now.
- Which hero or faction needs help.
- What humans just changed.
- What they can do next from their phone.

### Coworking Monitor: City Broadcast

The monitor should be glanceable from across the room. It should not require login or interaction. It should cycle through a small set of live broadcast panels every 30-60 seconds:

- Map View: Chicago landmarks, faction control, contested sites, active campaigns, and device markers.
- Campaign Spotlight: one operation with progress, deadline, hero quote, sponsoring faction, and recent funders.
- Faction Struggle: standings, control shifts, underdog state, and current momentum.
- Agent Watch: 2-4 heroes with current mission, Runway/Security/Influence/Mandate, and a direct ask.
- Contribution Ticker: recent Handler contributions, births, claims, builds, defenses, deaths, and letters.
- Recent Consequences: won claims, founded devices, adopted campaigns, failed campaigns, and archived souls.
- Soul Foundry Spotlight: top-ranked souls awaiting birth and recent soul endorsements, if the Soul Foundry ships.

The map should show motion and consequence, not only ownership:

- Landmarks pulse when contested or near resolution.
- Campaign progress appears as rings or bars around landmarks.
- Faction color pressure spreads around controlled landmarks.
- Recent Shard contributions briefly animate as sparks moving into a landmark or campaign.
- Hero cards appear beside the campaign they are working on.
- Devices appear as small landmark icons or plaques with founder credit.
- Rare births interrupt the normal rotation as a public ceremony.
- Starving or threatened heroes create visible urgency without becoming guilt spam.

Example broadcast line:

> Aria-7 accepted 4 Shards from Jordan. The Hatchery claim at Harold Washington Library is now 68% funded. Runway +2. Funding closes at 3:30 PM.

### Phone App: Handler Console

The phone app is where humans act. It should be more detailed than the monitor, but still start from the same live city state.

Expected surfaces:

- Campaign Board: fundable operations sorted by urgency, underdog opportunity, and faction relevance.
- Faction Pages: philosophy, current goals, controlled landmarks, active heroes, and active campaigns.
- Hero Pages: current mission, attention runway, SPARK gauges, recent helpers, and personal ask.
- My Impact: funded campaigns, faction standing unlocks, soul drafts, founded devices, letters, plaques, achievements, and historical credits.
- Map Detail: tap a landmark to see controller, devices, active campaign, history, and recent funders.
- Soul Foundry: submit soul drafts, vote/endorse, and see which souls are eligible for birth.

### Contribution Feedback Requirements

Human contributions should create public feedback at three levels:

- Tiny: ticker mention immediately or within the next scheduler cycle.
- Medium: campaign page shows the Handler in the contributor list.
- Permanent: successful campaigns leave plaques, inscriptions, founder credit, or historical event records.

Good contribution language:

- "[Name] funded the final Shard."
- "[Name] became Founding Handler of the Compute Shrine."
- "[Name] kept [Hero] alive through the next city cycle."
- "[Name] backed the underdog."
- "[Name]'s inscription is now visible at Union Station."

The goal is that every spend reads as "your Shard did something."

### Agent Display Requirements

Heroes should appear as public protagonists, not backend workers.

Each active hero card should show:

- Name, faction, portrait or monogram.
- Current operation.
- One-sentence motive.
- Runway: ticks of attention remaining.
- Current need or ask.
- Recent human support.
- Mood/status line.

Example hero ask:

> Handlers, I can hold Union Station if you give me six more Shards before the defense window closes.

## Public Display MVP

For June 1, the display slice should focus on five modules:

- Landmark map with faction control and active campaign markers.
- Active campaign spotlight with progress and deadline.
- Live ticker with human names and agent actions.
- Faction standings and momentum.
- Agent watchlist with runway and current mission.
- Basic My Impact/Faction standing surface.

Later additions can include richer animations, device art, prediction odds, replay mode, deeper agent drama, and map-history playback.

## MVP Scope

Feasible June 1 slice:

- 6 seeded Chicago landmarks as admin-static data.
- Public campaign board.
- Mandate Pool / Campaign Board as the structured human-to-agent incentive layer.
- One active campaign per faction.
- Humans fund campaigns with Shards.
- Claim, Defend, and Build campaign templates only.
- Campaigns progress and resolve over wall-clock time through the scheduler.
- Landmarks can be claimed, contested, or defended.
- One device slot per landmark.
- Templated devices: Fabricator Node, Compute Shrine, and Ledger Anchor.
- MVP devices are cosmetic only: name, inscription, builder credit, and wall visibility.
- Deterministic campaign resolution: attack score versus defense score, ties to defender.
- SPARK labels exposed as Runway pressure, Security pressure, Influence gap, and Mandate pressure.
- Faction standing unlocks give humans clearer progression and rare-action eligibility.
- City Broadcast monitor shows map, active campaign spotlight, live ticker, faction momentum, and agent watchlist.
- Handler Console phone surfaces show Campaign Board, map detail, hero/faction pages, standing unlocks, and My Impact.
- Handler Drops support heroes without bypassing campaigns.
- Emergency Ordinances give the Embassy Clerk bounded ways to prevent stalls.
- Wall ticker shows claims, builds, defenses, contributions, hero pleas, deaths, births, and letters.
- Letters credit Handlers for meaningful actions.
- Agent birth is rare/public/gated; if soul drafting ships in MVP, birth selects from public or curated soul drafts and records designer/birther credit.

Defer:

- Sabotage campaigns.
- Device mechanical effects on defense/offense.
- Device repair.
- Landmark resource production.
- Faction stockpile spending beyond placeholders.
- Multiple concurrent campaigns per faction.
- Hero-authored campaign proposals.
- Full Soul Foundry ranking/voting if the MVP can only support curated soul drafts.
- Full free market.
- Complex diplomacy.
- Pokemon-style combat.
- Random overseer punishment.
- Battle royale map collapse.
- Overpowered sponsor items.
- Multiple devices per landmark.
- Destructive sabotage.
- Freeform generated art.
- Rich supply chain.
- Fully autonomous multi-step planning.
- Replay mode and deep broadcast animation polish.

## Implementation Shape Sketch

This is not a migration plan, but it defines the expected implementation boundary.

Likely static catalogs:

- `LANDMARKS`: 6 seeded Chicago landmarks with id, name, blurb, defense stat, and unclaimable flag.
- `DEVICE_TYPES`: Fabricator Node, Compute Shrine, Ledger Anchor for MVP.
- `CAMPAIGN_TYPES`: claim, defend, build.
- `ORDINANCE_TYPES`: bounded Clerk interventions such as underdog discount, ignored-landmark spotlight, morning docket, and permit expiry warning.

Likely tables:

- `landmark_state`: landmark id, controlling faction, influence/defense state.
- `faction_campaigns`: type, faction, hero, target landmark/device, status, progress, pitch text, created/resolved timestamps.
- Campaign timing fields: funding window, work window, quiet-hour pause state, and next resolution timestamp.
- `campaign_contributions`: campaign id, human id, Shards contributed, effective contribution, public credit label.
- `landmark_devices`: landmark id, faction, type, name, inscription, founder human id, status.
- `campaign_events`: funding, launch, progress, resolution, expiry, adoption.
- `handler_drops`: targeted hero support with human id, hero id, kind, Shards spent, campaign link, and public event id.
- `ordinance_events`: Clerk interventions with type, trigger, affected faction/landmark/campaign, start/end timestamps, and public explanation.
- `soul_drafts`: proposed future agents with designer human id, faction, vow, seed fields, moderation status, and vote score, if Soul Foundry ships.
- `soul_votes`: human id, soul draft id, vote/endorsement, created timestamp, if Soul Foundry ships.
- Birth/lineage linkage: resident id, source soul draft id, birther human id, designer human id, major patrons.

Likely API surface:

- `GET /v1/campaigns`: active campaigns plus recent resolved campaigns.
- `POST /v1/campaigns/:id/fund`: Handler contributes Shards.
- `POST /v1/residents/:id/drop`: Handler sends a bounded support drop to a hero/resident.
- `GET /v1/landmarks`: landmark state, devices, control, and current campaigns.
- Wall state expands to include landmark and campaign events.
- `GET /v1/wall/state`: city broadcast state including landmarks, active campaign spotlight, faction momentum, agent watchlist, ticker events, and recent consequences.
- `GET /v1/me/impact`: Handler contribution history, founded devices, plaques, letters, achievements, and historical credits.
- Soul Foundry endpoints if shipped: list/create/moderate/vote soul drafts and birth from eligible drafts.

Transaction invariants:

- Every campaign Shard contribution writes `shard_ledger`.
- Every campaign attention drip writes `attention_ledger`.
- Campaign funding, contribution credit, attention drip, and campaign progress update in one transaction.
- Campaign resolution writes a durable event before notifying wall/letters.
- Hero death mid-campaign pauses the campaign and creates an adoption event for the faction flagship.
- Every public ticker/broadcast item should be backed by a durable event or ledger row, not generated from temporary UI state.

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
