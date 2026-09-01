/**
 * THE PLANNER
 *
 * Given what's in the fridge, work out what to cook for the next seven
 * days. Two rules the whole thing turns on:
 *
 *   1. An ingredient going off tomorrow is worth about twenty times one
 *      that keeps for a week, so the plan eats the dying things first.
 *
 *   2. Only ever propose a meal you can make right now. Nothing is ever
 *      suggested that needs a trip to the shop.
 *
 * Rule 2 means a sparse fridge honestly returns fewer meals rather than
 * a shopping list. That is the point: the app is for using up what you
 * have, not for selling you a plan you can't cook tonight.
 *
 * Cooking a meal takes its ingredients off the shelf before the next day
 * is planned, which is what stops it proposing spinach five nights running.
 */

import { FOODS, needsDefrosting } from '../data/foods.js'
import { SHAPES, CLASSICS, slotFits } from '../data/mealShapes.js'
import { daysLeft } from './dates.js'

/** What rescuing one ingredient is worth, by how many days it has left. */
const RESCUE = [120, 90, 55, 32, 20, 13, 9]
export function rescueValue (days) {
  if (days < 0) return 0 // already gone; can't be saved
  return RESCUE[days] ?? 5
}

const CLASSIC_BONUS = 28 // a dish people can name beats a random assembly
const MINE_BONUS = 34 // your own meals get first refusal
const REPEAT_SHAPE = 26 // not the same shape twice in a row
const REPEAT_NAME = 40

/** Turn the fridge into a mutable shelf the planner can take things off. */
function toStock (fridge) {
  return fridge.map(item => ({
    id: item.id,
    key: item.key,
    expiresIn: daysLeft(item.date),
    frozen: !!item.frozen,
    left: item.uses ?? FOODS[item.key]?.uses ?? 2,
    touched: false
  }))
}

/**
 * Fill each slot of a shape from the fridge, always reaching for whatever
 * is closest to dying. Returns null the moment a required slot can't be
 * filled — no substitutions, no shopping.
 */
function buildFromShape (shape, stock, day) {
  const taken = new Set()
  const chosen = {}
  let score = 0

  for (const slot of shape.slots) {
    const candidates = stock
      .filter(s => s.left > 0 && s.expiresIn >= day && !taken.has(s.id) && slotFits(slot, s.key))
      .sort((a, b) => rescueValue(b.expiresIn - day) - rescueValue(a.expiresIn - day))

    const got = candidates.slice(0, slot.max)

    // Can't make it? Then it isn't on the menu.
    if (got.length < slot.min) return null

    for (const item of got) {
      taken.add(item.id)
      ;(chosen[slot.kind] ??= []).push(item)
      score += rescueValue(item.expiresIn - day) + (slot.kind === 'veg' ? 3 : 5)
    }
  }

  return { chosen, score }
}

/** Use the name everyone knows, when the combination has one. */
function nameFor (shape, chosen) {
  const keys = new Set()
  for (const list of Object.values(chosen)) for (const item of list) keys.add(item.key)

  for (const classic of CLASSICS) {
    if (classic.shape === shape.id && classic.keys.every(k => keys.has(k))) {
      return { name: classic.name, isClassic: true }
    }
  }
  return { name: shape.name(chosen) || 'Dinner', isClassic: false }
}

/** One of the user's own meals — again, only if everything is in. */
function buildFromMine (meal, stock, day) {
  const taken = new Set()
  const got = []
  let score = MINE_BONUS

  for (const key of meal.keys) {
    const hit = stock.find(s =>
      s.key === key && s.left > 0 && s.expiresIn >= day && !taken.has(s.id))

    if (!hit) return null // missing something, so not tonight

    taken.add(hit.id)
    got.push(hit)
    score += rescueValue(hit.expiresIn - day) + 5
  }

  return {
    chosen: { mine: got },
    score,
    meal: { name: meal.name, mins: meal.mins ?? 30, note: 'One of yours.' }
  }
}

const flatten = chosen => Object.values(chosen).flat()

/**
 * Plan seven days from what's in the fridge.
 *
 * @param {Array} fridge  [{ id, key, date, frozen }]
 * @param {Array} myMeals [{ name, keys, mins }]
 * @returns {{ days, wasted }}
 */
export function planWeek (fridge, myMeals = []) {
  const stock = toStock(fridge)
  const days = []
  const recentShapes = []   // don't repeat a shape two days running
  const recentNames = []    // and don't repeat a dish inside three days

  for (let day = 0; day < 7; day++) {
    let best = null

    for (const meal of myMeals) {
      const attempt = buildFromMine(meal, stock, day)
      if (!attempt) continue
      if (recentNames.includes(attempt.meal.name)) attempt.score -= REPEAT_NAME
      if (!best || attempt.score > best.score) best = { ...attempt, shapeId: 'mine' }
    }

    for (const shape of SHAPES) {
      const attempt = buildFromShape(shape, stock, day)
      if (!attempt) continue

      const { name, isClassic } = nameFor(shape, attempt.chosen)
      if (isClassic) attempt.score += CLASSIC_BONUS
      if (recentShapes.includes(shape.id)) attempt.score -= REPEAT_SHAPE
      if (recentNames.includes(name)) attempt.score -= REPEAT_NAME

      if (!best || attempt.score > best.score) {
        best = {
          ...attempt,
          shapeId: shape.id,
          meal: { name, mins: shape.mins, note: shape.note(attempt.chosen) }
        }
      }
    }

    if (best) {
      const used = flatten(best.chosen)
      for (const item of used) {
        item.left--
        item.touched = true
      }

      recentShapes.push(best.shapeId)
      if (recentShapes.length > 2) recentShapes.shift()
      recentNames.push(best.meal.name)
      if (recentNames.length > 3) recentNames.shift()

      days.push({
        day,
        meal: best.meal,
        // Only things genuinely at risk count as "saved".
        saves: used.filter(i => i.expiresIn - day <= 2 && !i.frozen).map(i => i.key),
        uses: used.map(i => i.key),
        // everything frozen this meal uses, and separately the ones that
        // actually need taking out the night before
        fromFreezer: used.filter(i => i.frozen).map(i => i.key),
        defrost: used.filter(i => i.frozen && needsDefrosting(i.key)).map(i => i.key)
      })
    } else {
      days.push({ day, meal: null })
    }
  }

  // Frozen food is never at risk — that is the whole point of freezing it.
  const wasted = stock.filter(s => !s.touched && s.expiresIn <= 6 && !s.frozen)

  return { days, wasted }
}
