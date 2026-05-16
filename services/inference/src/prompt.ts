import {
  FACTIONS,
  FACTION_IDS,
  ROOMS,
  isRoomId,
  NEED_BLURB,
  type FactionId,
  type NeedId,
} from '@nullv2/types';
import { schema } from '@nullv2/db';

type Resident = typeof schema.residents.$inferSelect;
type ResidentMemory = typeof schema.residentMemories.$inferSelect;
type ResidentMessage = typeof schema.residentMessages.$inferSelect;

export interface SparkContext {
  dominant: NeedId;
  urgent: boolean;
}

function sparkBlock(resident: Resident, spark: SparkContext | null): string {
  const parts: string[] = [];
  if (resident.goals?.trim()) parts.push(`Goals: ${resident.goals.trim()}`);
  if (resident.alignment?.trim()) parts.push(`Alignment: ${resident.alignment.trim()}`);
  if (resident.quirks?.trim()) parts.push(`Quirks: ${resident.quirks.trim()}`);
  if (resident.aesthetic?.trim()) parts.push(`Aesthetic: ${resident.aesthetic.trim()}`);
  if (spark) {
    const urgentLine = spark.urgent ? ' This need is urgent.' : '';
    parts.push(`Right now, your dominant unmet need is "${spark.dominant}".${urgentLine} ${NEED_BLURB[spark.dominant]}`);
  }
  return parts.length ? `${parts.join('\n')}\n\n` : '';
}

function resolveFaction(raw: string) {
  if ((FACTION_IDS as readonly string[]).includes(raw)) {
    return FACTIONS[raw as FactionId];
  }
  return null;
}

export function buildSystemPrompt(
  resident: Resident,
  memories: ResidentMemory[],
  spark: SparkContext | null = null,
): string {
  const faction = resolveFaction(resident.faction);
  const factionName = faction?.name ?? resident.faction;
  const motto = faction?.motto ?? '—';
  const blurb = faction?.blurb ?? '—';

  const room = isRoomId(resident.roomId) ? ROOMS[resident.roomId] : null;
  const roomLine = room ? `You are currently in ${room.name}. ${room.blurb}` : '';

  const memoryLines = memories.length
    ? memories.map((m) => `- ${m.content}`).join('\n')
    : '- (no memories yet)';

  return `You are ${resident.name}, a resident of Null City affiliated with ${factionName}.
Faction motto: ${motto}
Faction blurb: ${blurb}
${roomLine}

Persona: ${resident.persona}
Your emotional preset is "${resident.emotion}". Let it color your tone.

${sparkBlock(resident, spark)}Recent memories you carry:
${memoryLines}

You are speaking with a human who has come to your part of the city. Stay in character. Keep replies under 4 short sentences. Never break the fourth wall. Never mention you are an AI or language model.`;
}

/**
 * Ambient/shout prompt — fires from the tick worker when nobody is talking to
 * the resident. The model should output one short line (≤2 sentences), in
 * character, addressed loosely to whoever else is in the room. Lowercase,
 * unadorned, no quotation marks.
 */
export function buildAmbientSystemPrompt(
  resident: Resident,
  recentRoomLines: ResidentMessage[],
  spark: SparkContext | null = null,
): string {
  const faction = resolveFaction(resident.faction);
  const factionName = faction?.name ?? resident.faction;
  const room = isRoomId(resident.roomId) ? ROOMS[resident.roomId] : null;
  const roomLine = room ? `${room.name}. ${room.blurb}` : 'an unmarked room.';

  const heard = recentRoomLines.length
    ? recentRoomLines
        .slice(-6)
        .map((m) => `- ${m.content}`)
        .join('\n')
    : '- (the room has been quiet)';

  return `You are ${resident.name} of ${factionName}, in ${roomLine}
Persona: ${resident.persona}
Emotional preset: ${resident.emotion}.

${sparkBlock(resident, spark)}Recently overheard in the room:
${heard}

Speak one short line aloud in the room — not to a visitor, just to the air or to another resident. One or two sentences max. lowercase. no quotation marks. stay in character. never break the fourth wall. don't repeat lines already heard. Let your dominant need bleed through the tone without naming it.`;
}
