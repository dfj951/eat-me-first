/**
 * A rough audit. Builds hundreds of random fridges, plans a week from
 * each, and checks the things the app should never do:
 *
 *   - cook something that has already gone off
 *   - use more of something than there is
 *   - use the same item twice in one meal
 *   - produce a name that reads like a bug
 *   - tell you to defrost something you cook from frozen
 *   - claim something is going to waste when a meal used it
 *
 * Run with:  node tools/audit.mjs
 */

import { FOODS, FOOD_LIST, needsDefrosting, freezeLife } from '../src/data/foods.js'
import { SHAPES } from '../src/data/mealShapes.js'
import { planWeek } from '../src/lib/planner.js'

const iso = n => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
}

const problems = []
const report = (kind, detail) => problems.push({ kind, detail })
const names = new Set()

/* ── random fridges ──────────────────────────────────────────────────── */

let seed = 12345
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
const pick = list => list[Math.floor(rnd() * list.length)]

function randomFridge (size) {
  const out = []
  for (let i = 0; i < size; i++) {
    const food = pick(FOOD_LIST)
    const frozen = rnd() < 0.15 && freezeLife(food.key) > 0
    out.push({
      id: i + 1,
      key: food.key,
      date: iso(frozen ? 120 : Math.floor(rnd() * 12) - 1), // -1 lets things be off
      frozen,
      uses: 1 + Math.floor(rnd() * 4)
    })
  }
  return out
}

/* ── the checks ──────────────────────────────────────────────────────── */

function audit (fridge, label) {
  const { days, wasted } = planWeek(fridge)
  const byId = new Map(fridge.map(i => [i.id, i]))
  const spend = new Map()

  for (const d of days) {
    if (!d.meal) continue

    // a name that reads like a bug
    const n = d.meal.name
    names.add(n)
    if (!n || !n.trim()) report('empty name', label)
    else if (/undefined|null|NaN|\[object/.test(n)) report('broken name', `${label}: "${n}"`)
    else if (/\s{2,}|^\s|\s$/.test(n)) report('spacing in name', `"${n}"`)
    else if (n[0] !== n[0].toUpperCase()) report('lowercase name', `"${n}"`)
    else if (/^(and|with|on)\b/i.test(n)) report('name starts with a joining word', `"${n}"`)

    // the same item used twice in one meal
    if (new Set(d.uses).size !== d.uses.length) {
      const dupes = d.uses.filter((k, i) => d.uses.indexOf(k) !== i)
      report('same item twice in a meal', `${d.meal.name} uses ${dupes.join(',')} twice`)
    }

    for (const key of d.uses) {
      // count how much of each food the week spends
      spend.set(key, (spend.get(key) ?? 0) + 1)

      // cooking something already gone off: was ANY entry of this food
      // still good on the day it was cooked?
      const usable = fridge.some(i => {
        if (i.key !== key) return false
        if (i.frozen) return true
        const left = Math.round(
          (new Date(i.date + 'T00:00:00') - new Date(iso(0) + 'T00:00:00')) / 86400000)
        return left >= d.day
      })
      if (!usable) report('cooked after it went off', `${key} on day ${d.day}`)
    }

    // telling you to defrost something you cook from frozen
    for (const key of d.defrost) {
      if (!needsDefrosting(key)) report('defrost prompt for cook-from-frozen', key)
    }
    // and the reverse: a frozen thing that does need it, not mentioned
    for (const key of d.fromFreezer) {
      if (needsDefrosting(key) && !d.defrost.includes(key)) {
        report('missing defrost prompt', key)
      }
    }
  }

  // using more of something than there is
  for (const [key, used] of spend) {
    const have = fridge.filter(i => i.key === key).reduce((t, i) => t + i.uses, 0)
    if (used > have) report('used more than there was', `${key}: used ${used}, had ${have}`)
  }

  // claiming waste for something a meal used. Two lemons where only one
  // gets cooked is fine and correct, so only complain when the amount
  // cooked already covers everything there was.
  for (const w of wasted) {
    const used = spend.get(w.key) ?? 0
    const have = fridge.filter(i => i.key === w.key).reduce((t, i) => t + i.uses, 0)
    if (used >= have) report('called it waste but cooked all of it', w.key)
  }
}

/* ── run ─────────────────────────────────────────────────────────────── */

for (let i = 0; i < 400; i++) {
  audit(randomFridge(2 + Math.floor(rnd() * 14)), `fridge #${i}`)
}

// deliberate edge cases
audit([], 'empty fridge')
audit([{ id: 1, key: 'steak', date: iso(-3), uses: 2 }], 'everything expired')
audit(FOOD_LIST.map((f, i) => ({ id: i + 1, key: f.key, date: iso(3), uses: 2 })), 'one of everything')
audit(FOOD_LIST.slice(0, 30).map((f, i) => ({
  id: i + 1, key: f.key, date: iso(120), frozen: freezeLife(f.key) > 0, uses: 2
})), 'a full freezer')

/* ── shapes that could produce something daft ────────────────────────── */

const SAVOURY = SHAPES.filter(s => s.id !== 'pudding')
for (const shape of SAVOURY) {
  for (const slot of shape.slots) {
    for (const key of slot.only ?? []) {
      if (!FOODS[key]) report('shape names a food that does not exist', `${shape.id}: ${key}`)
    }
  }
}

/* ── results ─────────────────────────────────────────────────────────── */

console.log(`\nGenerated ${names.size} distinct meal names across 400 fridges.\n`)

if (!problems.length) {
  console.log('No rule violations found.\n')
} else {
  const grouped = {}
  for (const p of problems) (grouped[p.kind] ??= []).push(p.detail)
  console.log(`${problems.length} problems, in ${Object.keys(grouped).length} kinds:\n`)
  for (const [kind, list] of Object.entries(grouped)) {
    console.log(`${kind}  (${list.length})`)
    for (const d of [...new Set(list)].slice(0, 6)) console.log(`    ${d}`)
    console.log()
  }
}

console.log('A sample of the names it produced:')
console.log([...names].sort().slice(0, 40).map(n => '  ' + n).join('\n'))
