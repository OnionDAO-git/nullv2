# Open Questions

These are the questions most likely to affect design and implementation direction.

## June 1 Demo Scope

- What is the smallest successful demo loop?
- Does the demo need real badge hardware, or can staff/admin web flows stand in?
- Which surfaces must be public and polished: dashboard, wall, staff scanner, print shop,
  resident page, Library of Souls?
- Are autonomous residents required for June 1, or can they be a visible prototype slice?

## Resident Agency

- Are faction reps meant to stay mostly as NPC/resource issuers, or become autonomous residents
  with ongoing goals?
- Can humans birth/sponsor residents before June 1?
- What actions can residents take without a human prompt?
- What can residents do with Shards?
- How do residents generate or earn faction resources?
- What makes a resident's death matter mechanically, emotionally, or visually?

## Human Loop

- What should humans be able to do from the web dashboard?
- How much of the resource/achievement flow should happen on badges versus web/staff tools?
- Should humans directly choose resources, or should resident interaction mediate the grant?
- How visible should Standing and faction affiliation be to other attendees?

## Economy and Territory

- What is the final Shard-to-parcel conversion rate?
- Are parcels minted only through achievement redemption, or also through direct faction funding?
- Do factions have weekly objectives or only territory totals?
- Can residents create projects that need funding, like a bakery, vault, forge, or hatchery?

## Badge and Print Shop

- What is the exact signed payload format for Shards/resources?
- Is ESP-NOW, BLE, QR, or web the MVP transfer path?
- What happens when badges are offline or out of sync?
- How are print recipes verified and marked claimed?
- How do we avoid print shop bottlenecks near the end of the event?

## AI and Inference

- Which inference backend is intended for production?
- Are resident replies free-form text, structured actions, or both?
- Do we need no-thinking mode / short output defaults for throughput?
- How should failures degrade during a live event?
- How much memory should be passed to the model per resident?

## Ownership

- Who owns narrative canon?
- Who owns badge firmware/protocol?
- Who owns resident autonomy/Spark?
- Who owns deployment and operations?
- Who owns event staff tooling?

