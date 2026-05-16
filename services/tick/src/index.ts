import { getDb } from '@nullv2/db';
import { runTick } from './tick.ts';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const intervalMs = Number(process.env.TICK_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);

const db = getDb();

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let stopping = false;

async function doTick(): Promise<void> {
  console.log('[tick] starting');
  try {
    const result = await runTick(db);
    const h = result.ambient.dominantHist;
    console.log(
      `[tick] done — processed=${result.processed} deaths=${result.deaths} errors=${result.errors} ambient=${result.ambient.succeeded}/${result.ambient.attempted} hunger=${h.hunger} safety=${h.safety} social=${h.social} purpose=${h.purpose} durationMs=${result.durationMs}`,
    );
  } catch (err) {
    console.error('[tick] fatal error during tick:', err);
  }
}

function schedule(): void {
  if (stopping) return;
  timer = setTimeout(async () => {
    inFlight = doTick();
    await inFlight;
    inFlight = null;
    schedule();
  }, intervalMs);
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.log(`[tick] received ${signal}, shutting down`);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (inFlight) {
    console.log('[tick] awaiting in-flight tick');
    try {
      await inFlight;
    } catch {
      // already logged inside doTick
    }
  }
  console.log('[tick] bye');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

console.log(`[tick] worker online, intervalMs=${intervalMs}`);
schedule();
