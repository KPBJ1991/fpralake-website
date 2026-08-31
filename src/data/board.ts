/**
 * Chapter board of directors.
 *
 * Roster supplied by the chapter on 2026-08-31, listed in the order given.
 * Credentials are part of the `name` string and follow the style guide's
 * convention of trailing the full name, comma-separated (guide pp.22–23:
 * "Jane Doe, APR, CPRC").
 *
 * No headshots or bios yet: `title`, `org`, and `email` are omitted rather
 * than filled with placeholder text, and BoardCard falls back to an initials
 * avatar wherever a photo would go.
 *
 * NOTE: the Brand Standards (p.25) require board information to be kept
 * current and reviewed annually by September 1.
 */

export type BoardMember = {
  /** Board position, e.g. 'President'. */
  role: string;
  /** Full name, including any trailing credentials. */
  name: string;
  /** Professional title at their employer. Omitted until supplied. */
  title?: string;
  /** Employer / organization. Omitted until supplied. */
  org?: string;
  /** Contact address shown on the card. Omitted until supplied. */
  email?: string;
};

export const board: BoardMember[] = [
  { role: 'President', name: 'Kelsey Marquez' },
  { role: 'Treasurer', name: 'Susyn Stecchi' },
  { role: 'Membership', name: 'Elisha Pappacoda' },
  { role: 'Secretary/Communications', name: 'Lexie Farmer' },
  { role: 'Accreditation', name: 'Nanci Schwartz, APR, CPRC' },
  { role: 'Past President', name: 'Kevin Yurasek' },
];
