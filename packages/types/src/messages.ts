/**
 * Catalogs for `resident_messages` + `resident_memories` rows.
 *
 * `resident_messages.channel`:
 *   - 'chat'  — visitor-initiated turn (or the resident's reply within one).
 *   - 'shout' — autonomous ambient utterance from the tick worker.
 *
 * `resident_messages.speaker`:
 *   - 'human'    — the visitor.
 *   - 'resident' — the AI persona.
 *
 * `resident_memories.kind`:
 *   - 'birth'       — first-line memory seeded at spawn.
 *   - 'interaction' — short summary written after a chat tx.
 *   - 'reflection'  — written alongside an ambient shout.
 *   - 'death'       — final memory written by the tick worker on kill.
 */

export const SPEAKER_IDS = ['resident', 'human'] as const;
export type Speaker = (typeof SPEAKER_IDS)[number];

export const MESSAGE_CHANNEL_IDS = ['chat', 'shout'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNEL_IDS)[number];

export const MEMORY_KIND_IDS = ['birth', 'interaction', 'reflection', 'death'] as const;
export type MemoryKind = (typeof MEMORY_KIND_IDS)[number];

export function isSpeaker(value: string): value is Speaker {
  return (SPEAKER_IDS as readonly string[]).includes(value);
}

export function isMessageChannel(value: string): value is MessageChannel {
  return (MESSAGE_CHANNEL_IDS as readonly string[]).includes(value);
}

export function isMemoryKind(value: string): value is MemoryKind {
  return (MEMORY_KIND_IDS as readonly string[]).includes(value);
}
