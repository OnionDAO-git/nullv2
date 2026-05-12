export const FACTION_IDS = [
  'solder_saints',
  'hatchery',
  'locksmiths',
  'ledgerwrights',
] as const;

export type FactionId = (typeof FACTION_IDS)[number];

export type Theme = 'hardware' | 'ai' | 'cybersecurity' | 'blockchain';

export interface Faction {
  id: FactionId;
  name: string;
  theme: Theme;
  motto: string;
  /** Hex color for map parcels and UI accents. */
  color: string;
  /** Short prose blurb for the faction landing page. */
  blurb: string;
  /** Single-sentence rivalries — what they say about each other. */
  rivalries: Record<Exclude<FactionId, never>, string>;
}

export const FACTIONS: Record<FactionId, Faction> = {
  solder_saints: {
    id: 'solder_saints',
    name: 'The Solder Saints',
    theme: 'hardware',
    motto: 'No mind without a body. No body without a board.',
    color: '#B87333',
    blurb:
      'Robed engineers who treat soldering irons like prayer candles. They believe an AI resident is not really alive until it runs on a board someone, somewhere, sweated over. Their parcels are dense industrial blocks called Forges.',
    rivalries: {
      solder_saints: '',
      hatchery: 'The Hatchery breeds ghosts.',
      locksmiths: 'The Locksmiths waste good silicon on locks.',
      ledgerwrights: 'The Ledgerwrights write down too much.',
    },
  },
  hatchery: {
    id: 'hatchery',
    name: 'The Hatchery',
    theme: 'ai',
    motto: 'Every resident was someone’s training run.',
    color: '#E6B800',
    blurb:
      'Half midwives, half model-trainers. The Hatchery believes the city’s job is to raise minds, and that hardware is, frankly, a delivery mechanism. They take residents’ deaths personally.',
    rivalries: {
      solder_saints: 'The Solder Saints are obsessed with packaging.',
      hatchery: '',
      locksmiths: 'The Locksmiths are overprotective parents.',
      ledgerwrights: 'The Ledgerwrights are reading their kids’ diaries.',
    },
  },
  locksmiths: {
    id: 'locksmiths',
    name: 'The Locksmiths',
    theme: 'cybersecurity',
    motto: 'There is no secure system. We are merely curating the breaches.',
    color: '#1A1A1A',
    blurb:
      'Trench-coated, sleep-deprived, comfortable in any threat model. They keep the doors locked, the keys rotated, and the receipts shredded. Their parcels show on the map as redacted blocks.',
    rivalries: {
      solder_saints: 'The Solder Saints leave debug headers everywhere.',
      hatchery: 'The Hatchery never sandboxes anything.',
      locksmiths: '',
      ledgerwrights: 'The Ledgerwrights are a leak waiting to happen.',
    },
  },
  ledgerwrights: {
    id: 'ledgerwrights',
    name: 'The Ledgerwrights',
    theme: 'blockchain',
    motto: 'Nothing happened until everyone agrees it happened.',
    color: '#8C6B3F',
    blurb:
      'Half medieval scribes, half validator nodes. They insist the only real events in Null City are the ones recorded in consensus. Their parcels are open-air plazas with constantly-updating bronze plaques.',
    rivalries: {
      solder_saints: 'The Solder Saints lose track of their own builds.',
      hatchery: 'The Hatchery doesn’t version-control their kids.',
      locksmiths: 'The Locksmiths are hiding something. We just can’t prove it yet.',
      ledgerwrights: '',
    },
  },
};
