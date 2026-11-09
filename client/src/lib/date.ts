const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The site's one date format: "18 Nov 2026". Read in UTC so a date-only value never shifts a day with the viewer's
 * time zone. Months are spelled out here rather than via Intl, whose en-GB "short" month is "Sept" in some browsers.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
