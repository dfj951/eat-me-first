/**
 * THE PLANNER
 *
 * Given what's in the fridge, work out what to cook for the next seven
 * days. The rule the whole thing turns on:
 *
 *   an ingredient going off tomorrow is worth about twenty times one
 *   that keeps for a week
 *
 * so the plan naturally eats the dying things first. Cooking a meal takes
 * its ingredients off the shelf before the next day is planned, which is
 * what stops it proposing spinach five nights running.
 */

import { FOODS, isCupboard } from '../data/foods.js'
import { SHAPES, CLASSICS, slotFits, standIn } from '../data/mealShapes.js'
import { daysLeft } from './dates.js'

/** What rescuing one ingredient is worth, by how many days it has left. */
const RESCUE = [120, 90, 55, 32, 20, 13, 9]
export function rescueValue (days) {
  if (days < 0) return 0 // already gone; can't be saved
  return RESCUE[days] ?? 5
}

const MISSING_FRESH = 48 // something you'd have to go out and buy
const MISSING_TIN = 9 // something that keeps, so you probably have it
const MISSING_BASE = 22 // extra: pasta without pasta isn't a pasta dish
const TOO_MUCH_SHOPPING = 90 // more than one fresh thing missing is a shop
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
    left: FOODS[item.key]?.uses ?? 2,
    touched: false
  }))
}

/** Fill each slot of a shape with whatever is dying soonest and fits. */
function buildFromShape (shape, stock, day) {
  const taken = new Set()
  const chosen = {}
  const missing = []
  let score = 0
  let freshMissing = 0

  for (const slot of shape.slots) {
    const candidates = stock
      .filter(s => s.left > 0 && s.expiresIn >= day && !taken.has(s.id) && slotFits(slot, s.key))
      .sort((a, b) => rescueValue(b.expiresIn - day) - rescueValue(a.expiresIn - day))

    const got = candidates.slice(0, slot.max)
    for (const item of got) {
      taken.add(item.id)
      ;(chosen[slot.kind] ??= []).push(item)
      score += rescueValue(item.expiresIn - day) + (slot.kind === 'veg' ? 3 : 5)
    }

    for (let short = got.length; short < slot.min; short++) {
      const buy = standIn(slot)
      missing.push(buy)
      if (isCupboard(buy)) {
        score -= MISSING_TIN
      } else {
        score -= MISSING_FRESH
        freshMissing++
      }
      if (slot.kind === 'base') score -= MISSING_BASE
    }
  }

  if (freshMissing > 1) score -= TOO_MUCH_SHOPPING
  return { chosen, missing, score }
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

/** One of the user's own saved meals, matched the straightforward way. */
function buildFromMine (meal, stock, day) {
  const taken = new Set()
  const got = []
  const missing = []
  let score = MINE_BONUS
  let freshMissing = 0

  for (const key of meal.keys) {
    const hit = stock.find(s =>
      s.key === key && s.left > 0 && s.expiresIn >= day && !taken.has(s.id))

    if (hit) {
      taken.add(hit.id)
      got.push(hit)
      score += rescueValue(hit.expiresIn - day) + 5
    } else {
      missing.push(key)
      if (isCupboard(key)) {
        score -= MISSING_TIN
      } else {
        score -= MISSING_FRESH
        freshMissing++
      }
    }
  }

  if (freshMissing > 1) score -= TOO_MUCH_SHOPPING
  return {
    chosen: { mine: got },
    missing,
    score,
    meal: { name: meal.name, mins: meal.mins ?? 30, note: 'One of yours.' }
  }
}

const flatten = chosen => Object.values(chosen).flat()

/**
 * Plan seven days.
 *
 * @param {Array} fridge  [{ id, key, date, frozen }]
 * @param {Array} myMeals [{ name, keys, mins }]
 * @returns {{ days, wasted, toBuy }}
 */
export function planWeek (fridge, myMeals = []) {
  const stock = toStock(fridge)
  const days = []
  const toBuy = new Set()
  const recentShapes = []
  let lastName = ''

  for (let day = 0; day < 7; day++) {
    let best = null

    for (const meal of myMeals) {
      const attempt = buildFromMine(meal, stock, day)
      if (attempt.meal.name === lastName) attempt.score -= REPEAT_NAME
      if (!best || attempt.score > best.score) {
        best = { ...attempt, shapeId: 'mine' }
      }
    }

    for (const shape of SHAPES) {
      const attempt = buildFromShape(shape, stock, day)
      if (!flatten(attempt.chosen).length) continue

      const { name, isClassic } = nameFor(shape, attempt.chosen)
      if (isClassic) attempt.score += CLASSIC_BONUS
      if (recentShapes.includes(shape.id)) attempt.score -= REPEAT_SHAPE
      if (name === lastName) attempt.score -= REPEAT_NAME

      if (!best || attempt.score > best.score) {
        best = {
          ...attempt,
          shapeId: shape.id,
          meal: { name, mins: shape.mins, note: shape.note(attempt.chosen) }
        }
      }
    }

    if (best && best.score > 0) {
      const used = flatten(best.chosen)
      for (const item of used) {
        item.left--
        item.touched = true
      }
      for (const key of best.missing) toBuy.add(key)

      recentShapes.push(best.shapeId)
      if (recentShapes.length > 2) recentShapes.shift()
      lastName = best.meal.name

      days.push({
        day,
        meal: best.meal,
        // Only things genuinely at risk count as "saved".
        saves: used.filter(i => i.expiresIn - day <= 2 && !i.frozen).map(i => i.key),
        uses: used.map(i => i.key),
        defrost: used.filter(i => i.frozen).map(i => i.key),
        missing: best.missing
      })
    } else {
      days.push({ day, meal: null })
    }
  }

  // Frozen food is never at risk — that is the whole point of freezing it.
  const wasted = stock.filter(s => !s.touched && s.expiresIn <= 6 && !s.frozen)

  return { days, wasted, toBuy: [...toBuy] }
}
