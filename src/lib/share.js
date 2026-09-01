/**
 * SHARING A FRIDGE
 *
 * Two people, one kitchen, and no server anywhere. The whole fridge is
 * packed into the link itself — after the #, which browsers never send
 * to the server, so even the host that serves the page never sees what's
 * in your fridge. Send it on WhatsApp and the other phone unpacks it.
 *
 * The limit is URL length. A normal fridge is a few hundred bytes; a
 * hundred items would be pushing it, and `encode` says so rather than
 * handing over a link that silently truncates.
 */

const MAX_URL = 8000 // comfortably under what browsers and apps will carry

/** Only the fields worth sending, with the empty ones left out. */
function slim (fridge) {
  return fridge.map(item => {
    const out = { k: item.key, d: item.date }
    if (item.uses) out.u = item.uses
    if (item.label) out.l = item.label
    if (item.role) out.r = item.role
    if (item.frozen) out.f = 1
    if (item.noDate) out.n = 1
    if (item.openEnded) out.o = 1
    return out
  })
}

/** base64 that survives UTF-8 names like "Crème fraîche". */
const pack = text => btoa(String.fromCharCode(...new TextEncoder().encode(text)))
const unpack = code =>
  new TextDecoder().decode(Uint8Array.from(atob(code), c => c.charCodeAt(0)))

/** A link that carries the fridge. Returns null if it would be too long. */
export function encodeFridge (fridge) {
  if (!fridge.length) return null
  const url = location.origin + location.pathname + '#fridge=' + pack(JSON.stringify(slim(fridge)))
  return url.length > MAX_URL ? null : url
}

/** Read a shared fridge out of the current URL, or null if there isn't one. */
export function decodeFromUrl () {
  const match = location.hash.match(/^#fridge=(.+)$/)
  if (!match) return null
  try {
    const rows = JSON.parse(unpack(match[1]))
    if (!Array.isArray(rows)) return null

    return rows.map((row, i) => ({
      id: i + 1,
      key: row.k,
      date: row.d,
      uses: row.u,
      label: row.l,
      role: row.r ?? null,
      frozen: !!row.f,
      noDate: !!row.n,
      openEnded: !!row.o
    })).filter(item => item.key && item.date)
  } catch {
    return null // someone mangled the link in a chat app
  }
}

/** Take the fridge back out of the address bar once it's been dealt with. */
export function clearUrl () {
  history.replaceState(null, '', location.pathname + location.search)
}
