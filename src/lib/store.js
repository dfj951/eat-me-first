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

export function clearFridge () {
  try { localStorage.removeItem(FRIDGE_KEY) } catch { /* nothing to do */ }
}
