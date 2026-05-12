import { FACTIONS, FACTION_IDS, type FactionId } from '@nullv2/types';
import { schema } from '@nullv2/db';

type Resident = typeof schema.residents.$inferSelect;
type ResidentMemory = typeof schema.residentMemories.$inferSelect;

function resolveFaction(raw: string) {
  if ((FACTION_IDS as readonly string[]).includes(raw)) {
    return FACTIONS[raw as FactionId];
  }
  return null;
}

export function buildSystemPrompt(resident: Resident, memories: ResidentMemory[]): string {
  const faction = resolveFaction(resident.faction);
  const factionName = faction?.name ?? resident.faction;
  const motto = faction?.motto ?? '—';
  const blurb = faction?.blurb ?? '—';

  const memoryLines = memories.length
    ? memories.map((m) => `- ${m.content}`).join('\n')
    : '- (no memories yet)';

  return `You are ${resident.name}, a resident of Null City affiliated with ${factionName}.
Faction motto: ${motto}
Faction blurb: ${blurb}

Persona: ${resident.persona}

Recent memories you carry:
${memoryLines}

You are speaking with a human who has come to your part of the city. Stay in character. Keep replies under 4 short sentences. Never break the fourth wall. Never mention you are an AI or language model.`;
}
