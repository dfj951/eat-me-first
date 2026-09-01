/**
 * Saving.
 *
 * Everything lives in this browser and nowhere else. No account, no
 * server, nothing sent anywhere. That is a deliberate feature, not a
 * limitation waiting to be fixed.
 *
 * Every read and write is wrapped, because localStorage genuinely throws
 * in private windows and when a browser is set to block site data.
 */

const FRIDGE_KEY = 'eat-me-first/fridge'
const MEALS_KEY = 'eat-me-first/meals'
const RECENT_KEY = 'eat-me-first/recent'
const DISLIKE_KEY = 'eat-me-first/disliked'
const HISTORY_KEY = 'eat-me-first/history'
const BARCODE_KEY = 'eat-me-first/barcodes'

function read (key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write (key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false // private window, or storage blocked. Carry on regardless.
  }
}

export const loadFridge = () => {
  const saved = read(FRIDGE_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveFridge = fridge => write(FRIDGE_KEY, fridge)

export const loadMeals = () => {
  const saved = read(MEALS_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveMeals = meals => write(MEALS_KEY, meals)

export const loadRecent = () => {
  const saved = read(RECENT_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveRecent = keys => write(RECENT_KEY, keys)

export const loadDislikes = () => {
  const saved = read(DISLIKE_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveDislikes = names => write(DISLIKE_KEY, names)

export const loadHistory = () => {
  const saved = read(HISTORY_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveHistory = entries => write(HISTORY_KEY, entries)

export const loadBarcodes = () => {
  const saved = read(BARCODE_KEY, {})
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
}

export const saveBarcodes = map => write(BARCODE_KEY, map)

export function clearFridge () {
  try { localStorage.removeItem(FRIDGE_KEY) } catch { /* nothing to do */ }
}
