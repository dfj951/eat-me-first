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
const SHOPPING_KEY = 'eat-me-first/shopping'
const AVOID_KEY = 'eat-me-first/avoided'
const TIME_KEY = 'eat-me-first/maxmins'
const HABITS_KEY = 'eat-me-first/datehabits'
const HOUSEHOLD_KEY = 'eat-me-first/household'

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

export const loadShopping = () => {
  const saved = read(SHOPPING_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveShopping = list => write(SHOPPING_KEY, list)

export const loadAvoided = () => {
  const saved = read(AVOID_KEY, [])
  return Array.isArray(saved) ? saved : []
}

export const saveAvoided = keys => write(AVOID_KEY, keys)

export const loadMaxMins = () => {
  const saved = read(TIME_KEY, null)
  return typeof saved === 'number' ? saved : null
}

export const saveMaxMins = mins => write(TIME_KEY, mins)

export const loadHabits = () => {
  const saved = read(HABITS_KEY, {})
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
}

export const saveHabits = habits => write(HABITS_KEY, habits)

export const loadHousehold = () => {
  const saved = read(HOUSEHOLD_KEY, 2)
  return Number.isFinite(saved) && saved >= 1 && saved <= 8 ? saved : 2
}

export const saveHousehold = n => write(HOUSEHOLD_KEY, n)

export function clearFridge () {
  try { localStorage.removeItem(FRIDGE_KEY) } catch { /* nothing to do */ }
}
