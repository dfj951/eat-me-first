/**
 * We build HTML from strings, which is fine as long as anything a person
 * typed goes through here first. Without it, naming a leftover
 * `<img onerror=...>` would run code. Cheap habit, no downside.
 */
const ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}

export const escapeHtml = value =>
  String(value).replace(/[&<>"']/g, char => ENTITIES[char])

/** "a", "a and b", "a, b and c" */
export const list = items =>
  items.length < 2
    ? (items[0] ?? '')
    : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]
