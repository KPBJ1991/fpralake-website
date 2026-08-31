# Content & brand to supply

The site is complete and building. These are the placeholders that need real
values before launch. Everything below lives in one of five files.

## 1. Brand — RESOLVED

The real assets were found in `~/Downloads/FPRA/` and are now in
`src/assets/brand/`. The site uses the official palette, Montserrat, and the
official chapter lockup. See `src/assets/brand/README.md`.

Two open items there: the logo's wordmark is **live text rather than outlines**
(re-export from the `.ai` with type outlined), and the presence of the **®
symbol** should be confirmed against the official artwork.

## 2. Board roster — DONE

The current board was supplied on 2026-08-31 and is live in
`src/data/board.ts` — six members, credentials formatted per the guide. This
satisfies the Brand Standards (p.25) requirement that board information be
current and reviewed annually by September 1.

Still outstanding for these cards, whenever the chapter has them:

- **Headshots.** Cards currently fall back to an initials avatar. Adding photo
  support is a `photo?: string` field on `BoardMember` plus an `<img>` in
  `BoardCard.astro`.
- **Titles, employers, contact addresses.** `title`, `org`, and `email` are
  optional and omitted; each renders automatically once present.

## 3. Events — now fetched from Eventbrite

The hand-written sample events are gone. `src/data/events.ts` fetches from the
Eventbrite organizer (ID `31488027001`) at build time, and the GitHub Actions
workflow rebuilds daily at 09:00 UTC so new events appear without a push.

- **Token**: `EVENTBRITE_TOKEN`, read from the environment and sent as a Bearer
  header only. Not in any committed file.
- **Fallback**: `src/data/events-cache.json` holds the last successful
  response. Any failure — missing token, 401, timeout, malformed payload —
  logs a `[events]` warning and builds from the cache instead of crashing.
- **The cache is currently empty**, because no fetch has succeeded yet (see the
  verification note below). Until one does, the Events page shows its
  empty state.

## 4. Contact details — `src/data/site.ts`  ⚠️ same September 1 deadline

- `email` — `fpralake@gmail.com`, confirmed by the chapter 2026-08-31.
- `phone`, `mailingAddress` — blank, so they are hidden. Add to show them.
- `meetingNote` — confirm the real cadence and venue.
- `formEndpoint` — blank. The contact page shows an email CTA while it is empty;
  add a Formspree/Netlify/etc. URL and a full contact form renders instead.
  (Deliberate: a form posting nowhere is worse than no form.)

## 5. Membership copy — `src/data/membership.ts`

`stateBenefits` is summarized from the live text at <https://www.fpra.org/join-us>
and should be accurate. `chapterBenefits` describes the Lake Chapter generically
— worth a read from someone who knows the chapter.

**Dues amounts are deliberately not listed anywhere on this site.** They are
maintained by the state office and the Membership page links out to
<https://www.fpra.org/join-us/membership-types> instead of duplicating them.

## 6. Chapter name — confirm

The official logo reads **"Lake County Chapter"**, so the site uses *FPRA Lake
County Chapter* throughout. The brief called it the "Lake Chapter" and the
domain is `fpralake.org`. If the shorter form is correct, change `site.name`
and `site.chapterName` in `src/data/site.ts` — everything else follows.

## 7. Eventbrite — needs one live verification

The integration is written and every failure path is tested, but **no
successful fetch has been made**, because `EVENTBRITE_TOKEN` is not available
locally. Two things are unverified against real data:

1. **Which collection holds the events.** An unauthenticated probe returns 401
   for both `/v3/organizers/{id}/events/` and `/v3/organizations/{id}/events/`,
   so the right one could not be determined ahead of time. The code tries
   organizer first and falls back to organization on a 404.
2. **The field mapping** — title, start/end, venue, summary — follows the
   documented response shape but has not been checked against an actual
   payload.

To verify, run a build with the token present and read the `[events]` line:

    EVENTBRITE_TOKEN=<token> npm run build

A line reading `fetched N event(s)` confirms both. A `falling back to cached
data` warning names the specific failure. The first successful CI run also
commits the populated cache back to the branch.
