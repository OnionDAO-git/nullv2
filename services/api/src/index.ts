import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { getDb } from '@nullv2/db';
import { meRoute } from './routes/me.ts';
import { factionsRoute } from './routes/factions.ts';
import { workshopsRoute } from './routes/workshops.ts';
import { residentsRoute } from './routes/residents.ts';
import { achievementsRoute } from './routes/achievements.ts';
import { wallRoute } from './routes/wall.ts';
import { printJobsRoute } from './routes/print-jobs.ts';
import { roomsRoute } from './routes/rooms.ts';
import { lettersRoute } from './routes/letters.ts';
import { libraryRoute } from './routes/library.ts';
import { adminRoute } from './routes/admin.ts';

const app = new Hono();

app.use('*', logger());
app.get('/healthz', (c) => c.json({ ok: true }));

const db = getDb();

app.route('/v1/me', meRoute(db));
app.route('/v1/factions', factionsRoute());
app.route('/v1/workshops', workshopsRoute(db));
app.route('/v1/residents', residentsRoute(db));
app.route('/v1/achievements', achievementsRoute(db));
app.route('/v1/wall', wallRoute(db));
app.route('/v1/print-jobs', printJobsRoute(db));
app.route('/v1/rooms', roomsRoute(db));
app.route('/v1/letters', lettersRoute(db));
app.route('/v1/library', libraryRoute(db));
app.route('/v1/admin', adminRoute(db));

const port = Number(process.env.API_PORT ?? 3100);
console.log(`[nullv2-api] listening on :${port}`);

export default { port, fetch: app.fetch };
