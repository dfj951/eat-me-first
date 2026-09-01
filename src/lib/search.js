/**
 * Finding food by what people actually type.
 *
 * The first version of this app only matched my own British labels, so
 * "cheese", "yogurt", "salad", "spaghetti" and "chips" all found nothing
 * and there was no way to add them. Aliases fixed the matching; the
 * "add it anyway" escape hatch in the UI fixed the dead end.
 */

import { FOOD_LIST, ALIASES } from '../data/foods.js'

/** Lower-case, straighten curly apostrophes, collapse whitespace. */
export const normalise = text =>
  String(text).toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()

/**
 * How good a match is this food for the query? Lower is better,
 * -1 means no match at all.
 *
 *   0  the name starts with what you typed        "chick" → Chicken
 *   1+ the name contains it                       "fish" → White fish
 *   3  an alias starts with it                    "zucchini" → Courgette
 *   4  an alias contains it
 *   8  only the category matches                  "veg"
 */
export function rank (food, query) {
  const name = normalise(food.label)
  if (name.startsWith(query)) return 0
  if (name.includes(query)) return 1 + name.indexOf(query) / 100

  for (const alias of ALIASES[food.key] ?? []) {
    if (alias.startsWith(query)) return 3
    if (alias.includes(query)) return 4
  }

  if (food.cat.includes(query)) return 8
  return -1
}

/** The best few matches, best first. */
export function searchFoods (text, limit = 7) {
  const query = normalise(text)
  if (!query) return []

  return FOOD_LIST
    .map(food => ({ food, score: rank(food, query) }))
    .filter(hit => hit.score >= 0)
    .sort((a, b) => a.score - b.score || a.food.label.length - b.food.label.length)
    .slice(0, limit)
    .map(hit => hit.food)
}

/** The single best match, or null. Used when parsing "mince, rice, onion". */
export const findFood = text => searchFoods(text, 1)[0] ?? null
