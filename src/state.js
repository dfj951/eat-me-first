/**
 * THE STATE
 *
 * One place that owns the fridge and your saved meals. Nothing else
 * writes to them directly — the UI calls these functions, the state
 * saves itself, and then tells whoever is listening to redraw.
 *
 * It's a very small version of what every UI framework does for you.
 * Worth understanding before reaching for one.
 */

import { FOODS, freezeLife, thawLife } from './data/foods.js'
import { inDays } from './lib/dates.js'
import { loadFridge, saveFridge, loadMeals, saveMeals, clearFridge,
  loadRecent, saveRecent, loadDislikes, saveDislikes } from './lib/store.js'

export const fridge = loadFridge()
export const myMeals = loadMeals()

/* What you've added lately, most recent first. Beats me guessing at what
   you buy: after a week it's your actual shopping, not my list. */
export const recent = loadRecent()
const RECENT_MAX = 14

/* Meals you've turned down. Kept by name, so it covers both the ones the
   app invents and the classics. Nothing is ever lost: everything here can
   be put back from the list in the fridge panel. */
export const disliked = loadDislikes()

function remember (key) {
  const at = recent.indexOf(key)
  if (at > -1) recent.splice(at, 1)
  recent.unshift(key)
  if (recent.length > RECENT_MAX) recent.length = RECENT_MAX
}

let nextId = Math.max(0, ...fridge.map(i => i.id ?? 0), ...myMeals.map(m => m.id ?? 0)) + 1

/* ── listeners ─────────────────────────────────────────────────────── */

const listeners = new Set()

/** Call `fn` whenever anything changes. Returns an unsubscribe function. */
export function onChange (fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function changed () {
  saveFridge(fridge)
  saveMeals(myMeals)
  saveRecent(recent)
  saveDislikes(disliked)
  for (const fn of listeners) fn()
}

/* ── the fridge ────────────────────────────────────────────────────── */

/** Add a known food, dated by how long it usually keeps. */
/* Some things keep so long the date is noise — a bag of oven chips you
   know you'll finish this week. They sit far enough in the future that
   nothing ever calls them at risk, and the row says "no date" rather
   than an absurd countdown. */
const NO_DATE = () => inDays(3650)

export function addFood (key, { date, noDate = false, uses, openEnded = false } = {}) {
  const food = FOODS[key]
  if (!food) return
  fridge.push({
    id: nextId++,
    key,
    noDate,
    openEnded,
    date: noDate ? NO_DATE() : (date || inDays(Math.min(food.days, 14))),
    // How many meals this will stretch to. Offered as the typical amount
    // for a normal shop, but it's yours to set.
    uses: uses || food.uses
  })
  remember(key)
  changed()
}

/**
 * Add something the app has never heard of. No meal will be built around
 * it, but the dates are still watched — and the plan says so plainly
 * rather than quietly ignoring it.
 */
export function addUnknown (name, { date, role = null, noDate = false, uses = 1, openEnded = false } = {}) {
  const clean = String(name).trim()
  if (!clean) return
  fridge.push({
    id: nextId++,
    key: 'own:' + clean.toLowerCase(),
    label: clean,
    noDate,
    openEnded,
    date: noDate ? NO_DATE() : (date || inDays(5)),
    uses,
    // Unset until you say what it is. Without a role no meal can place it.
    role
  })
  changed()
}

/** Change anything about an item in one go. */
export function updateItem (id, changes) {
  const item = fridge.find(i => i.id === id)
  if (!item) return
  if (changes.label && isUnknown(item)) {
    item.label = String(changes.label).trim()
    item.key = 'own:' + item.label.toLowerCase()
  }
  if ('noDate' in changes) {
    item.noDate = changes.noDate
    if (changes.noDate) item.date = NO_DATE()
  }
  if ('openEnded' in changes) item.openEnded = changes.openEnded
  if (changes.date && !item.noDate) item.date = changes.date
  if (changes.uses) item.uses = Math.max(1, Math.min(20, changes.uses))
  if ('role' in changes) item.role = changes.role || null
  changed()
}

/** Drop something from the recently-added chips. It stays searchable. */
export function forgetRecent (key) {
  const at = recent.indexOf(key)
  if (at > -1) recent.splice(at, 1)
  changed()
}

/** What kind of thing a hand-typed food is, so meals can use it. */
export function setRole (id, role) {
  const item = fridge.find(i => i.id === id)
  if (!item) return
  item.role = role || null
  changed()
}

/** The display name for a food key, including ones you named yourself. */
export function labelForKey (key) {
  if (FOODS[key]) return FOODS[key].label
  const own = fridge.find(i => i.key === key)
  return own?.label ?? key
}

/** How many meals' worth is left. Never below one. */
export function setUses (id, amount) {
  const item = fridge.find(i => i.id === id)
  if (!item) return
  item.uses = Math.max(1, Math.min(20, amount))
  changed()
}

/** This item's amount, falling back to the usual for that food. */
export const usesOf = item => item.uses ?? FOODS[item.key]?.uses ?? 2

export function removeItem (id) {
  const at = fridge.findIndex(i => i.id === id)
  if (at > -1) fridge.splice(at, 1)
  changed()
}

export function setDate (id, date) {
  const item = fridge.find(i => i.id === id)
  if (item && date) item.date = date
  changed()
}

/** Freezing stops the clock. */
export function freeze (id) {
  const item = fridge.find(i => i.id === id)
  const life = item && freezeLife(item.key)
  if (!life) return
  item.frozen = true
  item.date = inDays(life)
  changed()
}

/** Thawing starts a much shorter one. */
export function thaw (id) {
  const item = fridge.find(i => i.id === id)
  if (!item) return
  item.frozen = false
  item.date = inDays(thawLife(item.key))
  changed()
}

export function emptyFridge () {
  fridge.length = 0
  clearFridge()
  changed()
}

/* ── meals you'd rather not be offered ─────────────────────────────── */

/* The most recent one, so the screen can offer an immediate undo rather
   than making someone hunt for the list after a mistaken tap. */
export let lastDismissed = null

export function dislike (name) {
  if (name && !disliked.includes(name)) disliked.push(name)
  lastDismissed = name
  changed()
}

export function allow (name) {
  const at = disliked.indexOf(name)
  if (at > -1) disliked.splice(at, 1)
  if (lastDismissed === name) lastDismissed = null
  changed()
}

/** Hide the undo strip without putting the meal back. */
export function clearUndo () {
  lastDismissed = null
  changed()
}

/* ── your own meals ────────────────────────────────────────────────── */

export function addMeal (name, keys) {
  myMeals.push({ id: nextId++, name, keys, mins: 30 })
  changed()
}

export function removeMeal (id) {
  const at = myMeals.findIndex(m => m.id === id)
  if (at > -1) myMeals.splice(at, 1)
  changed()
}

/** The display name for a fridge item, including hand-typed ones. */
export function nameOf (item) {
  return item.label ?? FOODS[item.key]?.label ?? item.key
}

/** Was this added by hand, rather than picked from the food list? */
export const isUnknown = item => String(item.key).startsWith('own:')

/** The date we'd suggest for a food: today plus however long it usually keeps. */
export const suggestedDate = key =>
  inDays(FOODS[key] ? Math.min(FOODS[key].days, 14) : 5)
