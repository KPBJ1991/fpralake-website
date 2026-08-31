/**
 * Membership benefits.
 *
 * Sourced from the statewide benefits described at https://www.fpra.org/join-us
 * (membership is held with FPRA and includes chapter affiliation). Dues amounts
 * are deliberately not listed here — they are maintained by the state office at
 * https://www.fpra.org/join-us/membership-types.
 */

export type Benefit = {
  title: string;
  description: string;
};

/** Benefits delivered statewide by FPRA. */
export const stateBenefits: Benefit[] = [
  {
    title: 'A professional community',
    description:
      'Access to a statewide community of practitioners who actively support ' +
      'and help each other, across agencies, government, nonprofits, and ' +
      'in-house teams.',
  },
  {
    title: 'Professional development',
    description:
      'Virtual and in-person webinars, meetings, and workshops that build ' +
      'skills throughout the year, plus the annual PR & Comms Summit.',
  },
  {
    title: 'Credentialing and leadership',
    description:
      'Leadership and credentialing opportunities — including Accreditation ' +
      'in Public Relations — that move your career forward.',
  },
  {
    title: 'Recognition',
    description:
      'Entry into the Golden Image Awards, FPRA’s statewide competition ' +
      'recognizing outstanding public relations work.',
  },
  {
    title: 'Members-only resources',
    description:
      'Exclusive digital access to the membership directory, award summaries, ' +
      'past webinars, newsletters, and event calendars.',
  },
  {
    title: 'The FPRA Job Bank',
    description:
      'Listings for communications positions across Florida, available to ' +
      'members looking for their next role.',
  },
];

/** What membership adds at the Lake Chapter level. */
export const chapterBenefits: Benefit[] = [
  {
    title: 'Programs close to home',
    description:
      'Monthly chapter programming in Lake County, so professional ' +
      'development does not require a drive to Orlando or Tampa.',
  },
  {
    title: 'Local networking',
    description:
      'Regular contact with the communicators, reporters, and community ' +
      'leaders who shape how Lake County audiences hear from you.',
  },
  {
    title: 'A place to lead',
    description:
      'Committee and board service at the chapter level is the most direct ' +
      'route into FPRA leadership statewide.',
  },
];
