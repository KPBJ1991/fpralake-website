/**
 * Site-wide constants: identity, navigation, and outbound links.
 *
 * Naming and terminology follow the FPRA Brand Standards and Style Guide
 * (2025), p.3: "In all communications, Florida Public Relations Association
 * should be written out on first mention. On all subsequent mentions, it can
 * be abbreviated to FPRA." and "Association should be capitalized if referring
 * to the Florida Public Relations Association."
 */

export const site = {
  /**
   * The official chapter logo reads "Lake County Chapter", so that is used as
   * the formal name. TODO: confirm — the brief called it the "Lake Chapter"
   * and the domain is fpralake.org. Change here and it changes site-wide.
   */
  name: 'FPRA Lake County Chapter',
  shortName: 'FPRA Lake County',
  chapterName: 'Lake County Chapter',
  domain: 'fpralake.org',
  url: 'https://fpralake.org',
  parentOrg: 'Florida Public Relations Association',
  /** The Association's official tagline (guide p.3). Do not reword. */
  tagline: 'Enhancing the Profession Since 1938',
  /** The Association's official mission statement (guide p.3). Do not reword. */
  mission:
    'The Florida Public Relations Association is dedicated to developing ' +
    'public relations practitioners who, through ethical and standardized ' +
    'practices, enhance the public relations profession in Florida.',
  description:
    'The Lake County Chapter of the Florida Public Relations Association ' +
    'connects communications professionals across Lake County through monthly ' +
    'programs, professional development, and statewide recognition.',
} as const;

/** Verified links to the Association (fpra.org). */
export const fpra = {
  home: 'https://www.fpra.org',
  joinUs: 'https://www.fpra.org/join-us',
  membershipTypes: 'https://www.fpra.org/join-us/membership-types',
  faqs: 'https://www.fpra.org/join-us/faqs',
  about: 'https://www.fpra.org/about-us',
  professionalDevelopment: 'https://www.fpra.org/professional-development',
  events: 'https://www.fpra.org/events-0',
  recognition: 'https://www.fpra.org/recognition',
  foundation: 'https://www.fpra.org/education-foundation',
} as const;

/** FPRA State Office — verified from the style guide, p.3. */
export const stateOffice = {
  phone: '941-365-2135',
  email: 'state@fpra.org',
  address: '40 Sarasota Center Blvd, Suite 107, Sarasota, FL 34240',
} as const;

/**
 * Chapter contact details.
 *
 * Guide p.25, item 5: the chapter membership list (names, addresses, phone
 * numbers) must NOT be publicly available. The exception is contact
 * information provided to promote membership or communication with members —
 * which is what appears here and on the board page.
 */
export const contact = {
  email: 'fpralake@gmail.com', // confirmed by the chapter, 2026-08-31
  phone: '', // TODO: add if the chapter publishes one; left blank = hidden
  mailingAddress: '', // TODO: add if the chapter publishes one; blank = hidden
  /**
   * Form handler URL (e.g. a Formspree/Netlify endpoint). While this is
   * empty the contact page shows an email CTA instead of a form, so nothing
   * on the live site silently fails to submit.
   */
  formEndpoint: '', // TODO: add a form endpoint to enable the contact form
  meetingNote:
    'The chapter meets monthly. Location and time are announced with each ' +
    'program on the Events page.', // TODO: confirm cadence and venue
} as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Board', href: '/board' },
  { label: 'Events', href: '/events' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
] as const;
