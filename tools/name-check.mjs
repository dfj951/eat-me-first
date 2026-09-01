/**
 * DOES THE NAME MATCH THE DINNER?
 *
 * A shape can take a base — the carbohydrate underneath it — and its
 * name function might quietly ignore it. That is how "Chicken and
 * avocado salad" came to be served on a bed of pasta.
 *
 * This lists every base a shape can take whose name never mentions it.
 * Not every line is a bug: rice in a risotto and bread in a sandwich are
 * already in the word. It needs your eye. The question to ask of each
 * line is whether someone reading the name would be surprised by what
 * turned up on the plate.
 *
 *   node tools/name-check.mjs
 */

import { SHAPES, ROLES } from '../src/data/mealShapes.js'
import { cookName } from '../src/data/foods.js'

console.log('Bases that never make it into the name:')
console.log()

for (const shape of SHAPES) {
  const baseSlot = shape.slots.find(s => s.kind === 'base')
  if (!baseSlot) continue

  for (const key of baseSlot.only ?? []) {
    // one of everything the shape insists on, plus the base under test
    const p = { base: [{ key }] }
    for (const slot of shape.slots) {
      if (slot.kind === 'base') continue
      // a slot with no `only` list takes anything of that role
      const pool = slot.only ?? ROLES[slot.kind] ?? []
      const want = Math.max(slot.min, slot.kind === 'veg' ? 1 : 0)
      if (want) p[slot.kind] = (p[slot.kind] ?? []).concat(
        pool.slice(0, want).map(k => ({ key: k })))
    }

    let name
    try { name = shape.name(p) } catch (err) { name = 'THREW: ' + err.message }
    if (!name.toLowerCase().includes(cookName(key).toLowerCase()))
      console.log(`  ${shape.id.padEnd(11)} ${cookName(key).padEnd(18)} -> ${name}`)
  }
}
