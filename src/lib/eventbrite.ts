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

export type FetchResult = {
  events: ChapterEvent[];
  /** Organizer's public Eventbrite page, or null if the API did not supply it. */
  archiveUrl: string | null;
};

export type EventCache = {
  /** ISO timestamp of the last successful fetch, or null if never. */
  fetchedAt: string | null;
  source: string;
  /**
   * The organizer's public Eventbrite page, reported by the API rather than
   * constructed — the public URL slug cannot be derived from the numeric id.
   * Null until a fetch supplies it.
   */
  archiveUrl?: string | null;
  events: ChapterEvent[];
};

/**
 * The chapter's Eventbrite ORGANIZATION id — the entity that owns the events.
 *
 * Not to be confused with organizer id 31488027001, which the original brief
 * specified: that profile exists and is readable, but owns no events.
 * Discovered via /v3/users/me/organizations/, which reported exactly one
 * organization: 406186576245 (FPRA Lake).
 */
const ORGANIZATION_ID = '406186576245';
const API_BASE = 'https://www.eventbriteapi.com/v3';

/**
 * Both collections are still probed. The organization endpoint is the one
 * expected to answer; keeping the organizer path costs a single 404 and keeps
 * the fetch working if the account is ever restructured.
 */
const ENDPOINTS = [
  `${API_BASE}/organizations/${ORGANIZATION_ID}/events/`,
  `${API_BASE}/organizers/${ORGANIZATION_ID}/events/`,
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
  organizer?: { url?: string | null; name?: string | null } | null;
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
    url.searchParams.set('expand', 'venue,organizer');
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
export async function fetchEvents(token: string): Promise<FetchResult> {
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
          // Any event carries the organizer's public page; take the first.
          const archiveUrl =
            raw.find((e) => e.organizer?.url)?.organizer?.url?.trim() || null;
          return {
            events: mapped.sort((a, b) => b.date.localeCompare(a.date)),
            archiveUrl,
          };
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
  await reportAccessibleOrganizations(token);
  return { events: [], archiveUrl: null };
}

/**
 * Diagnostic only, run when no events were found.
 *
 * Eventbrite events are owned by an *organization*; an organizer is a profile
 * label attached to them. A valid organizer ID with zero events usually means
 * the events sit under an organization whose ID we were never given. This
 * lists the organizations the token can actually see, so the right ID can be
 * read straight out of the build log.
 *
 * Logs organization ids and names only — never the token. Never throws.
 */
async function reportAccessibleOrganizations(token: string): Promise<void> {
  try {
    const response = await getJson(`${API_BASE}/users/me/organizations/`, token);
    if (!response.ok) {
      console.warn(`[events] could not list organizations: ${response.status}`);
      return;
    }
    const body = (await response.json()) as {
      organizations?: Array<{ id?: string; name?: string }>;
    };
    const orgs = body.organizations ?? [];
    if (orgs.length === 0) {
      console.warn('[events] this token can see no organizations.');
      return;
    }
    const listed = orgs.map((o) => `${o.id} (${o.name ?? 'unnamed'})`).join(', ');
    console.warn(
      `[events] organizations visible to this token: ${listed}. ` +
        'If one of these owns the chapter calendar, set it as ORGANIZATION_ID in src/lib/eventbrite.ts.',
    );
  } catch (error) {
    console.warn(`[events] organization lookup failed: ${(error as Error).message}`);
  }
}
