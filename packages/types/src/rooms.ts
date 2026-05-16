import type { FactionId } from './factions.ts';

export const ROOM_IDS = [
  'atrium',
  'solder_chapel',
  'creche',
  'vault',
  'mempool',
] as const;

export type RoomId = (typeof ROOM_IDS)[number];

export interface Room {
  id: RoomId;
  slug: string;
  name: string;
  /** Null for civic / neutral rooms like the Atrium. */
  factionId: FactionId | null;
  /** Short prose blurb, italic-serif on the room card. */
  blurb: string;
}

export const ROOMS: Record<RoomId, Room> = {
  atrium: {
    id: 'atrium',
    slug: 'atrium',
    name: 'The Atrium',
    factionId: null,
    blurb:
      'the city’s shared landing. residents from every faction drift through. neutral ground, but never quite quiet.',
  },
  solder_chapel: {
    id: 'solder_chapel',
    slug: 'solder-chapel',
    name: 'The Solder Chapel',
    factionId: 'solder_saints',
    blurb:
      'a long room of benches under hanging lamps. flux smoke clings to the rafters. saints sign schematics here the way other people sign hymnals.',
  },
  creche: {
    id: 'creche',
    slug: 'creche',
    name: 'The Crèche',
    factionId: 'hatchery',
    blurb:
      'soft light, warm air, low tables. newborn residents wake here and are introduced to the city in whispers and weights.',
  },
  vault: {
    id: 'vault',
    slug: 'vault',
    name: 'The Vault',
    factionId: 'locksmiths',
    blurb:
      'no windows, two doors, both locked. the room everyone uses to discuss what should never be repeated. assume it is being recorded.',
  },
  mempool: {
    id: 'mempool',
    slug: 'mempool',
    name: 'The Mempool',
    factionId: 'ledgerwrights',
    blurb:
      'an open plaza with bronze plaques refreshing along the walls. scribes argue here in full view. nothing is final until quorum.',
  },
};

/** Home room for each faction — used for flagship placement, default birth room, etc. */
export const FACTION_HOME_ROOM: Record<FactionId, RoomId> = {
  solder_saints: 'solder_chapel',
  hatchery: 'creche',
  locksmiths: 'vault',
  ledgerwrights: 'mempool',
};

export function isRoomId(value: string): value is RoomId {
  return (ROOM_IDS as readonly string[]).includes(value);
}
