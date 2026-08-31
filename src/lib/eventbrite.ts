/**
 * Build-time fetch of chapter events from the Eventbrite API.
 *
 * SECRET HANDLING
 * The token is read from `process.env.EVENTBRITE_TOKEN` and sent only as an
 * `Authorization: Bearer` header — never as a query parameter, so it cannot
 * leak into a logged URL, an error message, or a redirect. It is never written
 * to the cache file and never printed. Do not add it to any committed file.
 *
 * FAILURE POLICY
 * A build must never break because Eventbrite is unreachable, rate-limiting,
 * or returning something unexpected. Every failure path warns and returns the
 * last-known-good snapshot from `src/data/events-cache.json`.
 */

export type ChapterEvent = {
  title: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** Human-readable time range, e.g. '11:30 a.m. – 1 p.m.'. */
  time?: string;
  location?: string;
  description: string;
  /** Registration link. */
  registerUrl?: string;
  /** Short label such as 'Luncheon' or 'Workshop'. */
  kind?: string;
};

export type EventCache = {
  /** ISO timestamp of the last successful fetch, or null if never. */
  fetchedAt: string | null;
  source: string;
  events: ChapterEvent[];
};

const ORGANIZER_ID = '31488027001';
const API_BASE = 'https://www.eventbriteapi.com/v3';

/**
 * Eventbrite exposes organizer-owned events under two different collections
 * depending on how the account is structured, and an unauthenticated probe
 * returns 401 for both — so the resource cannot be identified ahead of time.
 * Try the organizer collection first, then the organization one on a 404.
 */
const ENDPOINTS = [
  `${API_BASE}/organizers/${ORGANIZER_ID}/events/`,
  `${API_BASE}/organizations/${ORGANIZER_ID}/events/`,
];

/** Statuses worth showing. Drafts and cancellations are excluded. */
const STATUSES = 'live,started,ended,completed';

const REQUEST_TIMEOUT_MS = 15_000;

type EventbriteEvent = {
  name?: { text?: string | null } | null;
  summary?: string | null;
  description?: { text?: string | null } | null;
  start?: { local?: string | null; timezone?: string | null } | null;
  end?: { local?: string | null } | null;
  url?: string | null;
  online_event?: boolean | null;
  status?: string | null;
  venue?: { name?: string | null; address?: { city?: string | null } | null } | null;
};

/** '2026-09-17T11:30:00' -> '11:30 a.m.' (Eventbrite `local` is unzoned). */
function formatClock(local: string | null | undefined): string | null {
  if (!local) return null;
  const match = /T(\d{2}):(\d{2})/.exec(local);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const suffix = hour24 < 12 ? 'a.m.' : 'p.m.';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === '00' ? `${hour12} ${suffix}` : `${hour12}:${minute} ${suffix}`;
}

function formatTimeRange(start?: string | null, end?: string | null): string | undefined {
  const from = formatClock(start);
  if (!from) return undefined;
  const to = formatClock(end);
  return to ? `${from} – ${to}` : from;
}

function describe(event: EventbriteEvent): string {
  const text = event.summary?.trim() || event.description?.text?.trim() || '';
  // Card copy stays readable; the full description lives on Eventbrite.
  if (text.length <= 320) return text;
  const clipped = text.slice(0, 320);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : clipped.length).trimEnd()}…`;
}

function locate(event: EventbriteEvent): string | undefined {
  if (event.online_event) return 'Online';
  const name = event.venue?.name?.trim();
  const city = event.venue?.address?.city?.trim();
  if (name && city && !name.includes(city)) return `${name}, ${city}`;
  return name || city || undefined;
}

/** Maps one Eventbrite record, or null if it lacks the fields a card needs. */
function toChapterEvent(event: EventbriteEvent): ChapterEvent | null {
  const title = event.name?.text?.trim();
  const startLocal = event.start?.local;
  if (!title || !startLocal) return null;

  const date = startLocal.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return {
    title,
    date,
    time: formatTimeRange(startLocal, event.end?.local),
    location: locate(event),
    description: describe(event),
    registerUrl: event.url?.trim() || undefined,
  };
}

async function getJson(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: {
      // Header auth only — keeps the token out of URLs, logs, and referrers.
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/** Walks Eventbrite's continuation-token pagination, with a hard page cap. */
async function fetchAllPages(
  endpoint: string,
  token: string,
  useStatusFilter: boolean,
): Promise<EventbriteEvent[]> {
  const collected: EventbriteEvent[] = [];
  let continuation: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const url = new URL(endpoint);
    if (useStatusFilter) url.searchParams.set('status', STATUSES);
    url.searchParams.set('order_by', 'start_desc');
    url.searchParams.set('expand', 'venue');
    if (continuation) url.searchParams.set('continuation', continuation);

    const response = await getJson(url.toString(), token);
    if (!response.ok) {
      // Surface Eventbrite's own error code. A bare 401 cannot distinguish an
      // expired token from the wrong key type from insufficient scope, and
      // that distinction is what makes the failure actionable. The error body
      // describes the rejection; it never echoes the token.
      let detail = '';
      try {
        const body = (await response.json()) as {
          error?: string;
          error_description?: string;
        };
        const parts = [body?.error, body?.error_description].filter(Boolean);
        if (parts.length > 0) detail = ` (${parts.join(': ')})`;
      } catch {
        // Non-JSON body — the status alone will have to do.
      }
      const error = new Error(
        `Eventbrite responded ${response.status} ${response.statusText}${detail}`,
      );
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const body = (await response.json()) as {
      events?: EventbriteEvent[];
      pagination?: { has_more_items?: boolean; continuation?: string };
    };

    collected.push(...(body.events ?? []));
    if (!body.pagination?.has_more_items || !body.pagination.continuation) break;
    continuation = body.pagination.continuation;
  }

  return collected;
}

/**
 * Fetches and maps events.
 *
 * A 200 with an empty list is not proof the calendar is empty — the events may
 * simply live under the other collection, or be excluded by the status filter.
 * So every combination is probed until one yields events, and what each
 * attempt returned is logged. Throws only if no attempt reached the API at
 * all; callers handle the fallback.
 */
export async function fetchEvents(token: string): Promise<ChapterEvent[]> {
  const attempts: string[] = [];
  const errors: unknown[] = [];
  let anySucceeded = false;

  for (const useStatusFilter of [true, false]) {
    for (const endpoint of ENDPOINTS) {
      const collection = endpoint.includes('/organizers/') ? 'organizers' : 'organizations';
      const label = `${collection}${useStatusFilter ? '' : ' (no status filter)'}`;

      try {
        const raw = await fetchAllPages(endpoint, token, useStatusFilter);
        anySucceeded = true;

        const mapped = raw
          .map(toChapterEvent)
          .filter((event): event is ChapterEvent => event !== null);

        attempts.push(`${label}: ${raw.length} returned, ${mapped.length} usable`);

        if (mapped.length > 0) {
          console.info(`[events] source: ${label} endpoint.`);
          return mapped.sort((a, b) => b.date.localeCompare(a.date));
        }
      } catch (error) {
        attempts.push(`${label}: ${(error as Error).message}`);
        errors.push(error);
      }
    }
  }

  if (!anySucceeded) {
    throw errors[0] ?? new Error('No Eventbrite endpoint could be reached');
  }

  // Reached the API but found nothing anywhere — report every probe so the
  // cause (wrong ID, drafts only, genuinely empty calendar) is visible.
  console.warn(`[events] no events found. Probes: ${attempts.join(' | ')}`);
  return [];
}
