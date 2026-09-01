# Outstanding items

Last updated 2026-08-31.

The site is built, deployed, and live at
**<https://kpbj1991.github.io/fpralake-website/>** — temporarily, while DNS is
sorted out. All six pages render, the Eventbrite integration is working
against live data, and the daily rebuild is running.

What follows is what still needs a human.

---

## Needs action

### 1. DNS — the site is not at fpralake.org yet  ⚠️ blocking launch

`fpralake.org` resolves to Cloudflare (`104.21.75.63`, `172.67.215.182`) and
returns a 404. Nameservers are `coby.ns.cloudflare.com` / `lisa.ns.cloudflare.com`.
Nothing is currently served there.

In the Cloudflare dashboard, replace the apex A records with GitHub's:

    A  @  185.199.108.153
    A  @  185.199.109.153
    A  @  185.199.110.153
    A  @  185.199.111.153

Optionally `CNAME www → kpbj1991.github.io`.

**Set the proxy to "DNS only" (grey cloud), not proxied.** Cloudflare's proxy
intercepts the HTTP validation GitHub uses to issue the TLS certificate, and is
the usual cause of a Pages custom domain getting stuck without one. The proxy
can go back on after the certificate issues.

**Then switch the site back off the subpath** — the steps are also commented
above the `base` line in `astro.config.mjs`:

1. `site: 'https://fpralake.org'`
2. delete the `base` line
3. `gh api -X PUT repos/KPBJ1991/fpralake-website/pages -f cname=fpralake.org`
4. once the certificate issues:
   `gh api -X PUT repos/KPBJ1991/fpralake-website/pages -F https_enforced=true`

Internal links go through `withBase()` in `src/lib/url.ts`, so no link edits
are needed in either direction.

**Do the DNS records first and the cname last.** Setting the custom domain
immediately makes GitHub 301 every github.io request to `fpralake.org`, so the
current shareable link stops working the moment step 3 runs.

### 2. No upcoming events are published

The Eventbrite fetch works and returns 45 events — but **all 45 are in the
past**, ranging 2020-02-19 to 2026-07-29. So `/events` shows its
"nothing on the calendar" empty state above the archive, and the homepage shows
the same.

This is not a bug; the page is accurately reporting an empty upcoming calendar.
Publishing an event on Eventbrite is all that is needed — the daily cron picks
it up with no code change and no deploy.

### 3. Chapter contact details — `src/data/site.ts`

The Brand Standards (p.25) require chapter contact information to be kept
current, the same rule that covers the board roster.

- `email` — `fpralake@gmail.com`, confirmed 2026-08-31. ✅
- `phone`, `mailingAddress` — blank, so they stay hidden. Add to show them.
- `meetingNote` — still the generic "meets monthly" text. Confirm the real
  cadence and venue.
- `formEndpoint` — blank. The contact page shows an email CTA while it is
  empty; add a Formspree/Netlify/etc. URL and a full contact form renders
  instead. (Deliberate: a form posting nowhere is worse than no form.)

### 4. Chapter name — confirm

The official logo reads **"Lake County Chapter"**, so the site uses *FPRA Lake
County Chapter* throughout. The original brief called it the "Lake Chapter" and
the domain is `fpralake.org`. If the shorter form is correct, change
`site.name` and `site.chapterName` in `src/data/site.ts` — everything else
follows from those two values.

### 5. Logo artwork — two things to verify

Both are in `src/assets/brand/README.md`:

- **The wordmark is live text, not outlines.** `lakechapter-*.svg` sets "Lake
  County Chapter" as an SVG `<text>` element in Times New Roman Italic.
  Fallbacks are in place, but on a machine without that font the wordmark
  substitutes and the lockup will not match. Re-exporting from
  `LakeChapter.ai` with type converted to outlines removes the risk.
  Recommended before launch.
- **The ® symbol.** The guide (p.7) lists "missing the ® symbol" as
  unacceptable logo usage. Confirm the supplied artwork carries it.

---

## Worth doing, not blocking

### Board cards — `src/data/board.ts`

The six current members are live and correct. Optional additions, each of which
renders automatically once present:

- **Headshots.** Cards fall back to an initials avatar. Photo support is a
  `photo?: string` field on `BoardMember` plus an `<img>` in `BoardCard.astro`.
- **Titles, employers, contact addresses** — `title`, `org`, `email` are all
  optional and currently omitted.

### Membership copy — `src/data/membership.ts`

`stateBenefits` is summarised from the live text at <https://www.fpra.org/join-us>
and should be accurate. `chapterBenefits` describes the chapter generically and
is worth a read from someone who knows it.

Dues amounts are deliberately absent site-wide: they are maintained by the
State Office, and the Membership page links to
<https://www.fpra.org/join-us/membership-types> rather than duplicating figures
that would go stale.

### GitHub Actions deprecation warnings

`checkout@v4`, `setup-node@v4`, `configure-pages@v5`, and `deploy-pages@v4`
target Node 20 and are being force-run on Node 24. Harmless today; they will
break when GitHub removes the shim. Cheap to bump.

---

## Done — for reference

### Brand

Real assets were found in `~/Downloads/FPRA/` and are in `src/assets/brand/`.
The site uses the official palette, Montserrat, and the official lockup. FPRA
Navy `#1d1e4d` appears only at 100% opacity, never tinted, per the guide's
absolute rule. Details and the compliance notes are in
`src/assets/brand/README.md`.

### Board roster

Supplied 2026-08-31 and live in `src/data/board.ts` — six members, credentials
formatted per the guide. Satisfies the annual September 1 review requirement.

### Eventbrite integration

Working and verified against live data.

- **Organization ID `406186576245`** ("FPRA Lake"), not the organizer ID
  `31488027001` from the original brief. That organizer is a profile label — it
  exists and is readable but owns no events. It *is* the public archive page,
  which the Events page now links to.
- **Token**: `EVENTBRITE_TOKEN`, a repository secret, read from the environment
  and sent as a Bearer header only. Never in a committed file, never logged —
  only its length is.
- **Schedule**: the workflow rebuilds daily at 09:00 UTC, plus on push and on
  manual dispatch. GitHub may delay scheduled runs under load.
- **Fallback**: `src/data/events-cache.json` holds the last successful
  response, committed back by CI after each successful fetch. Any failure —
  missing token, 401, timeout, malformed payload — logs an `[events]` warning
  and builds from the cache rather than failing. Every path was tested.
- **Display**: `/events` shows the 8 most recent past programs (`PAST_LIMIT` in
  `events.astro`) with the remainder linked to the Eventbrite archive.
