import { Hono } from 'hono';
import { FACTIONS, RESOURCES, RESOURCE_IDS, FACTION_IDS } from '@nullv2/types';

/** Public read-only endpoint: factions + their resources. No auth required. */
export function factionsRoute() {
  const r = new Hono();

  r.get('/', (c) => {
    const data = FACTION_IDS.map((id) => {
      const faction = FACTIONS[id];
      const resources = RESOURCE_IDS
        .map((rid) => RESOURCES[rid])
        .filter((res) => res.faction === id);
      return { ...faction, resources };
    });
    return c.json({ factions: data });
  });

  r.get('/:id', (c) => {
    const id = c.req.param('id');
    if (!(FACTION_IDS as readonly string[]).includes(id)) {
      return c.json({ error: 'faction_not_found' }, 404);
    }
    const faction = FACTIONS[id as keyof typeof FACTIONS];
    const resources = RESOURCE_IDS
      .map((rid) => RESOURCES[rid])
      .filter((res) => res.faction === id);
    return c.json({ ...faction, resources });
  });

  return r;
}
