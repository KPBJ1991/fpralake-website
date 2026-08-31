/**
 * Chapter event calendar, fetched from Eventbrite at build time.
 *
 * The previous hand-written sample data is gone. Events now come from the
 * chapter's Eventbrite organizer; `src/data/events-cache.json` holds the
 * last-known-good response so a failed fetch degrades instead of breaking the
 * build. See `src/lib/eventbrite.ts` for the request and secret handling.
 */
import {
  fetchEvents,
  type ChapterEvent,
  type EventCache,
  type FetchResult,
} from '../lib/eventbrite';
import cache from './events-cache.json';

export type { ChapterEvent };

const CACHE_PATH = 'src/data/events-cache.json';

function fallback(reason: string): FetchResult {
  const snapshot = cache as EventCache;
  const age = snapshot.fetchedAt ? `last fetched ${snapshot.fetchedAt}` : 'never fetched';
  console.warn(
    `[events] ${reason} — falling back to cached data (${snapshot.events.length} events, ${age}).`,
  );
  return { events: snapshot.events, archiveUrl: snapshot.archiveUrl ?? null };
}

/**
 * Persists a successful fetch so the next failed build has something current
 * to fall back to. Skipped in dev, where rewriting a file that is imported
 * would retrigger HMR in a loop. Never contains the token.
 */
async function writeCache(result: FetchResult): Promise<void> {
  if (import.meta.env.DEV) return;
  try {
    const { writeFile } = await import('node:fs/promises');
    const payload: EventCache = {
      fetchedAt: new Date().toISOString(),
      source: 'eventbrite',
      archiveUrl: result.archiveUrl,
      events: result.events,
    };
    await writeFile(CACHE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch (error) {
    // A read-only or unexpected working directory must not fail the build.
    console.warn(`[events] could not update ${CACHE_PATH}: ${(error as Error).message}`);
  }
}

async function loadEvents(): Promise<FetchResult> {
  const rawToken = process.env.EVENTBRITE_TOKEN;

  if (!rawToken || rawToken.trim() === '') {
    return fallback('EVENTBRITE_TOKEN is not set');
  }

  // A secret saved with `echo` carries a trailing newline, which Eventbrite
  // rejects as malformed. Trim rather than fail on something so easy to hit.
  const token = rawToken.trim();
  if (token !== rawToken) {
    console.warn('[events] EVENTBRITE_TOKEN had surrounding whitespace; trimmed.');
  }
  // Shape only — never the value. Separates a truncated or padded secret from
  // a genuinely wrong one without exposing anything.
  console.info(`[events] token present (${token.length} chars).`);

  try {
    const result = await fetchEvents(token);
    const events = result.events;
    if (events.length === 0) {
      // An empty list is more likely a wrong ID or a filtered-out status than
      // a genuinely empty calendar, so prefer the cache if it has anything.
      const snapshot = cache as EventCache;
      if (snapshot.events.length > 0) {
        return fallback('Eventbrite returned no usable events');
      }
    }
    console.info(`[events] fetched ${events.length} event(s) from Eventbrite.`);
    await writeCache(result);
    return result;
  } catch (error) {
    // Never interpolate the token; only the message is surfaced.
    return fallback(`Eventbrite fetch failed: ${(error as Error).message}`);
  }
}

const loaded = await loadEvents();

export const events: ChapterEvent[] = loaded.events;

/**
 * The chapter's public Eventbrite page, for linking to programs older than
 * the site lists. Null until a fetch supplies it.
 */
export const archiveUrl: string | null = loaded.archiveUrl;

/** Local-midnight Date for an ISO `YYYY-MM-DD` string (avoids UTC drift). */
function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Splits the calendar relative to today. Upcoming events sort soonest-first,
 * past events sort most-recent-first.
 */
export function splitEvents(all: ChapterEvent[] = events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = all
    .filter((e) => toLocalDate(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = all
    .filter((e) => toLocalDate(e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}
