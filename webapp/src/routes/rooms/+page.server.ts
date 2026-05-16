import type { PageServerLoad } from './$types';
import { and, desc, eq, sql } from 'drizzle-orm';
import { schema } from '@nullv2/db';
import { ROOM_IDS, ROOMS, type RoomId } from '@nullv2/types';
import { db } from '$lib/server/db';

const FEED_LIMIT = 30;
const OCCUPANT_LIMIT = 12;

export interface RoomSummary {
  id: RoomId;
  slug: string;
  name: string;
  factionId: string | null;
  blurb: string;
  occupants: number;
}

export interface OccupantRow {
  id: string;
  name: string;
  faction: string;
  emotion: string;
  attentionBalance: number;
}

export interface FeedLine {
  id: string;
  residentId: string;
  residentName: string;
  faction: string;
  emotion: string;
  speaker: string;
  channel: string;
  content: string;
  fromHuman: boolean;
  createdAt: string;
}

export const load: PageServerLoad = async ({ url }) => {
  // Active room: ?room=slug (matches against room.slug or room.id); default atrium.
  const wanted = url.searchParams.get('room');
  const activeId: RoomId =
    (ROOM_IDS.find((id) => ROOMS[id].slug === wanted || ROOMS[id].id === wanted) as
      | RoomId
      | undefined) ?? 'atrium';

  // List + occupancy counts.
  const counts = await db
    .select({
      roomId: schema.residents.roomId,
      occupants: sql<number>`count(*)::int`,
    })
    .from(schema.residents)
    .where(eq(schema.residents.status, 'alive'))
    .groupBy(schema.residents.roomId);
  const occByRoom = new Map<string, number>();
  for (const c of counts) occByRoom.set(c.roomId, c.occupants);

  const rooms: RoomSummary[] = ROOM_IDS.map((id) => {
    const r = ROOMS[id];
    return {
      id,
      slug: r.slug,
      name: r.name,
      factionId: r.factionId,
      blurb: r.blurb,
      occupants: occByRoom.get(id) ?? 0,
    };
  });

  // Occupants of the active room.
  const occupantRows = await db
    .select({
      id: schema.residents.id,
      name: schema.residents.name,
      faction: schema.residents.faction,
      emotion: schema.residents.emotion,
      attentionBalance: schema.residents.attentionBalance,
    })
    .from(schema.residents)
    .where(and(eq(schema.residents.roomId, activeId), eq(schema.residents.status, 'alive')))
    .orderBy(schema.residents.name)
    .limit(OCCUPANT_LIMIT);

  // Recent dialogue feed for the active room.
  const feedRowsDesc = await db
    .select({
      id: schema.residentMessages.id,
      residentId: schema.residentMessages.residentId,
      humanId: schema.residentMessages.humanId,
      speaker: schema.residentMessages.speaker,
      channel: schema.residentMessages.channel,
      content: schema.residentMessages.content,
      createdAt: schema.residentMessages.createdAt,
    })
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.roomId, activeId))
    .orderBy(desc(schema.residentMessages.createdAt))
    .limit(FEED_LIMIT);
  const feedRows = feedRowsDesc.slice().reverse();

  // Resolve speakers (name/faction/emotion) for everyone in the feed — including
  // residents who have since left the room.
  const speakerIds = Array.from(new Set(feedRows.map((m) => m.residentId)));
  const speakers = speakerIds.length
    ? await db
        .select({
          id: schema.residents.id,
          name: schema.residents.name,
          faction: schema.residents.faction,
          emotion: schema.residents.emotion,
        })
        .from(schema.residents)
    : [];
  const speakerById = new Map(speakers.map((s) => [s.id, s]));

  const feed: FeedLine[] = feedRows.map((m) => {
    const s = speakerById.get(m.residentId);
    return {
      id: m.id,
      residentId: m.residentId,
      residentName: s?.name ?? 'unknown',
      faction: s?.faction ?? '',
      emotion: s?.emotion ?? 'stillness',
      speaker: m.speaker,
      channel: m.channel,
      content: m.content,
      fromHuman: !!m.humanId,
      createdAt: m.createdAt.toISOString(),
    };
  });

  // For the "Step forward" CTA — first alive resident in the active room.
  const stepForwardResident = occupantRows[0]?.id ?? null;

  return {
    rooms,
    activeId,
    occupants: occupantRows as OccupantRow[],
    feed,
    stepForwardResident,
  };
};
