# Brand assets

Sourced from `~/Downloads/FPRA/` on 2026-08-31.

| File | Notes |
| --- | --- |
| `1367_FPRA_Branding_Style_Guide_2025.pdf` | The authoritative guide (29 pp). |
| `LakeChapter.ai` | Original chapter lockup, Illustrator source. |
| `lakechapter-white.svg` | White (reversed) lockup, as supplied. |
| `lakechapter-navy.svg` | Same artwork, white fills set to FPRA Navy. |

## What the guide requires (and where it is enforced)

**Color** (p.8) — `src/styles/global.css`, the single `@theme` block.

> "FPRA Navy Blue may only be used at 100% opacity. **Tints are NOT acceptable
> in ANY circumstance.**"

`--color-navy` therefore has no numeric scale and is never given an opacity
modifier. Lighter surfaces and hover states use tints of the *palette* colors,
which the guide expressly permits ("Use a light tint of soft yellow or sky blue
to create a background for a sidebar").

| Role | Color | PMS | Hex |
| --- | --- | --- | --- |
| Corporate | FPRA Navy Blue | 2768C | `#1d1e4d` |
| Palette | Soft Yellow | 141C | `#ddb65b` |
| Palette | Royal Blue | 541C | `#003b71` |
| Palette | Sky Blue | 3105C | `#4daacc` |
| Palette | Silver | Cool Gray 6 | `#a7a9b4` |

The built CSS was audited and contains only these colors plus permitted tints.

**Type** (p.9) — Montserrat is required for HTML; self-hosted via
`@fontsource-variable/montserrat` so the site makes no third-party font
request. Times New Roman is the sanctioned accent face, used for the tagline
and pull quotes via the `.accent` class.

**Logo** (pp.4–7) — `src/components/Logo.astro`. Navy on light backgrounds,
white on navy. The guide permits only navy, black, and white; the navy file is
the supplied white artwork with fills swapped to an approved color, with no
change to geometry, proportion, or type.

## Two things to verify against the official artwork

1. **The wordmark is live text, not outlines.** `lakechapter-*.svg` sets
   "Lake County Chapter" as an SVG `<text>` element in Times New Roman Italic.
   Fallbacks were added (`Times, serif`), but on a machine without Times New
   Roman the wordmark will substitute and the lockup will not match the
   original. Re-exporting from `LakeChapter.ai` **with type converted to
   outlines** removes the risk entirely. Recommended before launch.
2. **The ® symbol.** The guide (p.7) lists "missing the ® symbol" as
   unacceptable logo usage. Confirm the supplied artwork carries it.

## Chapter Web Content Guidelines (p.25)

Each chapter website "is considered an official publication of the
Association." The binding items for this site:

- ✅ Displays affiliation with the Association and links to `www.fpra.org` from
  the homepage.
- ✅ Provides a homepage link to a membership recruitment page and links
  potential members to the Association membership site.
- ✅ **Board information updated annually by September 1.** The current board
  is live in `src/data/board.ts` (supplied 2026-08-31).
- ✅ Chapter **contact email** confirmed (`fpralake@gmail.com`, 2026-08-31).
  Phone, mailing address, and meeting cadence remain unset in
  `src/data/site.ts`; blank fields are hidden rather than shown empty.
- A site left unchanged for a year, or without current contact information, can
  have its link removed from fpra.org.
- The chapter membership list (names, addresses, phone numbers) must not be
  publicly available. Only contact details that promote membership or member
  communication appear on this site.
