/**
 * Dates, kept deliberately simple.
 *
 * Everything in the app is stored as a plain 'YYYY-MM-DD' string and
 * compared in whole days from today. No time zones, no clock arithmetic,
 * no libraries. A fridge doesn't care about hours.
 */

const DAY_MS = 86400000

/** Today at 00:00, so "days left" never depends on the time of day. */
export function midnight () {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

/** A Date (or today + n days) as 'YYYY-MM-DD'. */
export function toISO (date) {
  const d = new Date(date)
  return d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
}

/** The date `n` days from today, as 'YYYY-MM-DD'. */
export const inDays = n => toISO(new Date(midnight().getTime() + n * DAY_MS))

/** How many whole days until that date. Negative means it's gone. */
export const daysLeft = iso =>
  Math.round((new Date(iso + 'T00:00:00') - midnight()) / DAY_MS)

/** How urgent something is, as a class name for the CSS to colour. */
export function urgency (days) {
  if (days <= 1) return 'now'
  if (days <= 3) return 'soon'
  if (days <= 7) return 'ok'
  return 'long'
}

/** Plain English for a countdown. */
export function daysText (days) {
  if (days < 0) return days === -1 ? 'went off yesterday' : `${-days} days past its date`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `${days} days left`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "27 Feb", or "27 Feb 2027" when it isn't this year. */
export function shortDate (iso) {
  const d = new Date(iso + 'T00:00:00')
  const otherYear = d.getFullYear() !== new Date().getFullYear()
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + (otherYear ? ' ' + d.getFullYear() : '')
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday']
