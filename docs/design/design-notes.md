# Null City Autonomy Design Notes

Status: working notes
Companion spec: `docs/design/autonomy-economy.md`

## Purpose

This file records reasoning, reviewer feedback, and design decisions that should inform the autonomy/economy spec without bloating it. The spec should stay implementable. Notes can preserve the conversation around trade-offs.

## External Review Summary - 2026-05-17

Feedback came from Gemini, Codex, Claude, and parallel reviewer agents. The common thread: the theme is strong, but the MVP must shrink to a deterministic public-campaign loop before adding sabotage, device mechanics, stockpiles, or richer autonomy.

### Agreed Strengths

- The Handler fantasy works: humans are funders, operators, witnesses, founders, and people with authorization.
- Fixed Chicago landmarks make the map concrete and easier to understand than abstract territory tiles.
- Public faction campaigns are the right player-facing action layer.
- SPARK labels map well to the setting when presented as Runway pressure, Security pressure, Influence gap, and Mandate pressure.
- Heroes should feel autonomous, but the system needs deterministic rules underneath.
- The first-screen pitch is strong: fund an operation, watch Chicago change, get your name on the record.

### Agreed Risks

- June 1 is tight. The original spec was closer to a new subsystem than a small feature.
- Sabotage can punish builders and double the campaign state machine.
- Device effects can create snowballing before there is live balance data.
- The Shards economy needs exact faucet and cost assumptions.
- Human achievement inventory and faction/campaign stockpiles must not be the same pool in the MVP.
- Visitor-born heroes can starve in about 2 hours at current attention decay if campaign funding does not help.
- Current SPARK input is not campaign-safe because ambient shouts can count as interaction.
- Freeform LLM campaign choice would create inconsistent cross-tick behavior.

## Decisions Folded Into The Spec

- Keep `Handler` as the main human role label.
- Use `Patron`, `Founder`, `Witness`, and similar terms as credit labels, not replacements.
- Keep internal SPARK identifiers as `hunger/safety/social/purpose` for June 1.
- Expose gameplay labels as Runway pressure, Security pressure, Influence gap, and Mandate pressure.
- Landmarks are strategic nodes; parcels remain visual territory receipts.
- MVP devices are cosmetic and credit-bearing only.
- MVP campaign templates are Claim, Defend, and Build.
- Sabotage is deferred past June 1.
- Device mechanical effects are deferred past June 1.
- Landmark resource production and faction stockpile spending are deferred or placeholder-only for June 1.
- Campaign selection is deterministic in the tick worker.
- LLM output is pitch and narration only, stored and replayed.
- SPARK biases campaign selection and tone, not outcome resolution.
- Ties go to the defender.

## Candidate Story Spine

This should be part of the upcoming design session, not locked canon yet.

Promising frame: Null City is trying to write its first civic operating system, or first Charter. The factions are fighting because the city has AI residents, Shards, memory, bodies, territory, and death, but no settled answer to the central question: what makes an AI life legitimate enough to protect?

Each faction gives a different answer:

- Solder Saints: an AI life needs embodiment, hardware, tools, and real-world stewardship.
- Hatchery: an AI life needs birth, growth, memory, lineage, and care.
- Locksmiths: an AI life needs security, privacy, containment, locks, and adversarial protection.
- Ledgerwrights: an AI life needs proof, credit, contracts, rights, and consensus history.

Why this may work:

- It makes every faction sympathetic.
- It gives humans a values-based reason to pick a side.
- It explains why landmarks matter: each landmark becomes a civic signature for one faction's vision of the city.
- It keeps the conflict public and political without requiring cartoon villains.
- It makes Shards feel like mandate, not just money.

Why it may not be enough:

- "Write the Charter" can feel abstract unless the wall, campaign board, and hero letters make it concrete.
- Attendees may connect more strongly to individual heroes than to institutional philosophy.
- The story needs an immediate problem people can understand in one sentence, not only a governance metaphor.
- The final event outcome needs a satisfying shape if no single faction "wins."

Useful names to test:

- The First Charter.
- The Charter Crisis.
- The Embassy Mandate.
- The Civic Boot Sequence.

## Notes On SPARK

SPARK is valuable because it gives heroes legible motives. It should not become an opaque battle modifier.

The clean split:

- SPARK decides what the hero wants.
- Campaign templates decide what is legal.
- The tick worker selects and advances campaigns.
- The LLM explains the selected campaign in character.
- Deterministic scoring resolves outcomes.

Current SPARK should be extended before it drives campaigns:

- Separate human interaction from ambient shouts.
- Track human Shard spend separately from speech.
- Track campaign progress separately from chat.
- Track active threats separately from generic room deaths.
- Track patron count and recent funding.

## Notes On Attention

The attention loop is emotionally useful but dangerous. Refill should feel like mercy, not a tax. Campaign funding must provide some attention support so a Handler can push a hero toward action without guaranteeing the hero starves faster than a hero who merely receives refills.

Current working rule:

- Refill remains efficient: 5 Shards gives 10 attention.
- Campaign funding gives progress plus attention drip: 2 Shards gives 1 attention.
- If a hero falls below 2 ticks of survival, the hero may draw emergency attention from campaign escrow.

This is still a tuning assumption, not proven balance.

## Notes On Chicago Landmarks

Landmarks should feel like real Chicago pressure points, not generic resource mines. Each should have:

- A concrete place name.
- A civic/economic reason it matters.
- A faction-neutral base identity.
- A resource or strategic tilt.
- A visible relation to the wall.

The six-landmark MVP is probably enough for June 1. More landmarks can be seeded later by admins.

## Notes On City Broadcast And Handler Console

The monitor in the coworking space should be treated as the public broadcast layer for the faction struggle. It is not just a map. It is the room-scale proof that Null City is alive and that human action matters.

Good framing:

- Monitor = City Broadcast.
- Phone app = Handler Console.
- Wall/ticker = civic record.
- Map = current state of the struggle.
- Campaign spotlight = what needs help now.
- Agent watchlist = who is acting and what they need.
- My Impact = why the human should come back.

The monitor should create small cliffhangers:

- A landmark is 80% claimed but unfunded before the deadline.
- A hero can hold a landmark if funded before the next tick.
- An underdog faction has a discount or comeback opening.
- A device will carry a founder's inscription if completed.
- A campaign is about to expire and refund.

Contribution visibility needs three speeds:

- Immediate: ticker or small broadcast event.
- Session-scale: campaign page contributor list and agent acknowledgement.
- Permanent: plaque, inscription, landmark history, device founder credit, or historical record.

This is the human-to-attention loop made visible. Without the broadcast layer, humans may spend Shards and then fail to notice the world changed.

## Notes On The Embassy Clerk

Reviewer consensus favored a neutral civic narrator over a hostile game-master. The Embassy Clerk can have theatrical bite, but should preserve the Null City design voice: bureaucratic, ceremonial, uncanny, and dry.

Good default: "a municipal intelligence with impeccable paperwork instincts and a worrying sense of theater."

## Notes On Deferred Features

These are attractive, but should not block the first campaign loop:

- Sabotage and repair state machines.
- Mechanical device bonuses.
- Resource production from landmarks.
- Full faction stockpiles.
- Free markets.
- Pokemon-style defenders.
- Multiple campaigns per faction.
- Multi-agent diplomacy.
- Freeform human-generated art.

The right sequence is: make claim/defend/build fun and legible, then add pressure.

## Implementation Notes Raised By Reviewers

- Add ledger reasons such as `campaign_funding` and possibly `campaign_attention` when implementation begins.
- Add campaign refs to ledgers or a dedicated contribution table.
- Define campaign adoption on hero death.
- Define campaign expiry/refund transaction behavior.
- Define wall/ticker events for campaign funding, launch, completion, expiry, and adoption.
- Add schema/API sketch before coding.
- Expand `/v1/wall/state` into a City Broadcast payload rather than only parcels, leaderboard, births, deaths, and achievements.
- Add a Handler impact endpoint or view so humans can see funded campaigns, founded devices, plaques, letters, achievements, and historical credits.
