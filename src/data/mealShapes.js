/**
 * WHAT A MEAL IS
 *
 * There is no recipe list in this app. Instead:
 *
 *   1. Every ingredient is tagged with what ROLE it can play —
 *      a protein, a base, a vegetable, something to finish with.
 *   2. A dozen SHAPES describe how those roles fit together. A stir fry
 *      is a base, one protein, two or three of the right vegetables.
 *   3. The planner fills the slots from whatever is actually in the
 *      fridge, preferring whatever is closest to dying.
 *
 * The pay-off: tagging one new ingredient puts it into every shape it
 * suits. Adding steak is one line, and it turns up in the grill, the
 * stir fry, the sandwich and the salad on its own.
 */

import { cookName, labelOf } from './foods.js'

/* ── roles ─────────────────────────────────────────────────────────── */

export const ROLES = {
  protein: ['chicken', 'chickenthigh', 'cookedchicken', 'mince', 'porkmince',
    'sausages', 'bacon', 'ham', 'chorizo', 'steak', 'lambchops', 'porkchops',
    'gammon', 'turkey', 'burgers', 'salmon', 'whitefish', 'prawns',
    'smokedsalmon', 'fishfingers', 'eggs', 'tofu', 'halloumi', 'chickpeas',
    'beans', 'lentils', 'tuna', 'salami', 'mackerel', 'sardines'],

  veg: ['onion', 'carrot', 'potato', 'sweetpotato', 'tomato', 'pepper',
    'courgette', 'aubergine', 'mushroom', 'broccoli', 'cauliflower', 'spinach',
    'kale', 'lettuce', 'cucumber', 'celery', 'leek', 'cabbage', 'peas',
    'greenbeans', 'squash', 'avocado', 'asparagus', 'rocket', 'parsnip',
    'fennel', 'sprouts', 'sugarsnap', 'beetroot', 'sweetcorn',
    'edamame', 'pakchoi', 'watercress', 'springgreens'],

  base: ['pasta', 'rice', 'noodles', 'bread', 'tortilla', 'couscous',
    'gnocchi', 'potato', 'ovenchips', 'sweetpotato',
    'tortellini', 'naan', 'crackers', 'oats'],

  dairy: ['cheddar', 'parmesan', 'mozzarella', 'feta', 'cream', 'cremefraiche',
    'yoghurt', 'butter', 'creamcheese', 'milk', 'cottagecheese', 'ricotta'],

  sauce: ['tintom', 'coconutmilk', 'currypaste', 'pesto',
    'mayo', 'harissa', 'tahini', 'miso'],

  aroma: ['garlic', 'ginger', 'chilli', 'springonion', 'basil', 'coriander',
    'parsley', 'mint', 'lemon', 'lime'],

  fruit: ['apple', 'banana', 'berries', 'orange', 'grapes', 'melon',
    'pineapple', 'mango', 'pear', 'plum']
}

/** Leafy greens want throwing in at the very end, or not cooking at all. */
export const LEAFY = new Set(['spinach', 'kale', 'lettuce', 'rocket'])

/**
 * Can this food fill this slot?
 *
 * Food you typed in yourself has no entry in the catalogue, so it carries
 * the role you picked for it instead. A slot's `only` list names specific
 * built-in foods, which your own food can never be on — so for those we
 * go by the role alone. You said it was a vegetable; that's good enough.
 */
export function slotFits (slot, item) {
  if (item.role) return slot.kind === item.role

  const key = item.key
  if (slot.only) return slot.only.includes(key)
  if (slot.deny && slot.deny.includes(key)) return false
  const pool = ROLES[slot.kind]
  return pool ? pool.includes(key) : false
}

/* ── naming helpers ────────────────────────────────────────────────── */

const cap = t => t.charAt(0).toUpperCase() + t.slice(1)
const join = list =>
  list.length < 2 ? (list[0] ?? '') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]

/** The cooking names of the first `n` things picked for a given role. */
const picked = (p, kind, n = 9) =>
  (p[kind] ?? []).slice(0, n).map(item => item.label ? item.label.toLowerCase() : cookName(item.key))

/* ── the shapes a dinner comes in ──────────────────────────────────── */

export const SHAPES = [
  {
    id: 'grill',
    mins: 25,
    slots: [
      { kind: 'protein', min: 1, max: 1, only: ['steak', 'lambchops', 'porkchops', 'gammon', 'sausages', 'burgers', 'salmon', 'whitefish', 'fishfingers', 'chicken', 'chickenthigh', 'cookedchicken', 'turkey', 'halloumi'] },
      { kind: 'base', min: 0, max: 1, only: ['ovenchips', 'potato', 'sweetpotato'] },
      { kind: 'veg', min: 0, max: 2, deny: ['lettuce', 'cucumber', 'rocket', 'avocado', 'spinach', 'kale'] },
      { kind: 'protein', min: 0, max: 2, only: ['eggs', 'bacon', 'ham'] }
    ],
    // "Steak and chips" when there are chips, "Lamb chops with carrots"
    // when there aren't, and just "Steak" when it's only the steak.
    name: p => {
      const protein = picked(p, 'protein', 1)[0]
      // a side is plural on the plate: chips, potatoes
      const SIDES = { potato: 'potatoes', sweetpotato: 'sweet potatoes' }
      const baseKey = (p.base ?? [])[0]?.key
      const side = baseKey ? (SIDES[baseKey] ?? picked(p, 'base', 1)[0]) : undefined
      const veg = picked(p, 'veg', 1)[0]
      if (side) return cap(`${protein} and ${side}`)
      if (veg) return cap(`${protein} with ${veg}`)
      return cap(protein)
    },
    note: p => `Hot pan, don't crowd it, and rest the ${picked(p, 'protein', 1)[0]} as long as you cooked it.`
  },
  {
    id: 'pasta',
    mins: 22,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['pasta', 'gnocchi'] },
      { kind: 'protein', min: 0, max: 1, only: ['bacon', 'chicken', 'sausages', 'prawns', 'chorizo', 'mince', 'tuna', 'ham', 'salmon'] },
      { kind: 'veg', min: 0, max: 2, only: ['mushroom', 'courgette', 'tomato', 'spinach', 'pepper', 'peas', 'broccoli', 'aubergine', 'leek', 'onion', 'kale', 'asparagus'] },
      { kind: 'protein', min: 0, max: 1, only: ['eggs'] },
      { kind: 'sauce', min: 0, max: 1, only: ['tintom', 'pesto'] },
      { kind: 'dairy', min: 0, max: 2, only: ['parmesan', 'cream', 'cremefraiche', 'mozzarella', 'cheddar', 'milk'] }
    ],
    name: p => {
      const front = join([...picked(p, 'protein', 1), ...picked(p, 'veg', 1)]) ||
        picked(p, 'sauce', 1)[0] || picked(p, 'dairy', 1)[0] || 'plain'
      return cap(front) + ' pasta'
    },
    note: () => 'Sauce in the pan, pasta straight from the water into it, a splash of the water after.'
  },
  {
    id: 'curry',
    mins: 32,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['rice', 'noodles'] },
      { kind: 'protein', min: 1, max: 1, only: ['chicken', 'chickenthigh', 'lentils', 'chickpeas', 'beans', 'prawns', 'tofu', 'mince', 'whitefish', 'porkmince'] },
      { kind: 'veg', min: 1, max: 3, only: ['onion', 'spinach', 'pepper', 'squash', 'sweetpotato', 'cauliflower', 'peas', 'greenbeans', 'tomato', 'potato', 'aubergine', 'broccoli'] },
      { kind: 'sauce', min: 1, max: 1, only: ['coconutmilk', 'tintom', 'currypaste'] },
      { kind: 'aroma', min: 0, max: 2, only: ['garlic', 'ginger', 'chilli', 'coriander'] }
    ],
    name: p => cap(join([...picked(p, 'protein', 1), ...picked(p, 'veg', 1)])) + ' curry',
    note: () => 'Fry the spices until they smell of something before anything else goes in.'
  },
  {
    id: 'stirfry',
    mins: 18,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['noodles', 'rice'] },
      { kind: 'protein', min: 1, max: 1, only: ['chicken', 'prawns', 'tofu', 'porkmince', 'mince', 'steak', 'eggs', 'cookedchicken', 'turkey'] },
      { kind: 'veg', min: 1, max: 3, only: ['pepper', 'broccoli', 'carrot', 'cabbage', 'mushroom', 'greenbeans', 'sugarsnap', 'peas', 'courgette', 'springonion', 'spinach', 'sweetcorn'] },
      { kind: 'aroma', min: 0, max: 2, only: ['garlic', 'ginger', 'chilli', 'springonion'] }
    ],
    name: p => cap(join([...picked(p, 'protein', 1), ...picked(p, 'veg', 1)])) + ' stir fry',
    note: p => 'Everything chopped before the pan gets hot. Protein first, hard veg next' +
      ((p.veg ?? []).some(v => LEAFY.has(v.key)) ? ', anything leafy in the last thirty seconds.' : '.')
  },
  {
    id: 'traybake',
    mins: 45,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['potato', 'sweetpotato', 'gnocchi', 'ovenchips', 'squash'] },
      { kind: 'protein', min: 1, max: 1, only: ['sausages', 'chickenthigh', 'chicken', 'chorizo', 'salmon', 'whitefish', 'halloumi', 'mince', 'porkchops', 'beans', 'chickpeas'] },
      { kind: 'veg', min: 0, max: 3, only: ['pepper', 'onion', 'courgette', 'tomato', 'carrot', 'aubergine', 'broccoli', 'leek', 'fennel', 'parsnip', 'cauliflower', 'mushroom'] },
      { kind: 'sauce', min: 0, max: 1, only: ['tintom'] },
      { kind: 'dairy', min: 0, max: 1, only: ['mozzarella', 'feta', 'cheddar', 'parmesan'] }
    ],
    name: p => cap(picked(p, 'protein', 1)[0] ?? 'vegetable') + ' traybake',
    note: () => "One tin, hot oven, and don't crowd it or it steams instead of roasting."
  },
  {
    id: 'soup',
    mins: 35,
    slots: [
      { kind: 'veg', min: 1, max: 4, only: ['carrot', 'onion', 'leek', 'potato', 'celery', 'squash', 'cauliflower', 'broccoli', 'tomato', 'parsnip', 'cabbage', 'peas', 'spinach', 'sweetpotato'] },
      { kind: 'protein', min: 0, max: 1, only: ['beans', 'lentils', 'chickpeas', 'bacon', 'chorizo', 'chicken'] },
      { kind: 'sauce', min: 0, max: 1, only: ['tintom', 'coconutmilk'] },
      { kind: 'dairy', min: 0, max: 1, only: ['cream', 'cremefraiche', 'cheddar'] }
    ],
    name: p => cap(join(picked(p, 'veg', 2))) + ' soup',
    note: () => 'Sweat the veg in butter first — that is the difference between soup and hot water.'
  },
  {
    id: 'salad',
    mins: 15,
    slots: [
      { kind: 'veg', min: 1, max: 4, only: ['lettuce', 'cucumber', 'tomato', 'rocket', 'avocado', 'pepper', 'springonion', 'carrot', 'beetroot', 'sugarsnap', 'fennel'] },
      { kind: 'protein', min: 1, max: 1, only: ['feta', 'halloumi', 'chicken', 'cookedchicken', 'tuna', 'eggs', 'chickpeas', 'prawns', 'smokedsalmon', 'lentils', 'ham', 'beans'] },
      { kind: 'base', min: 0, max: 1, only: ['couscous', 'bread', 'potato', 'pasta'] },
      { kind: 'aroma', min: 0, max: 1, only: ['lemon', 'mint', 'basil', 'parsley'] }
    ],
    name: p => cap(join([...picked(p, 'protein', 1), ...picked(p, 'veg', 1)])) + ' salad',
    note: () => 'Dress it at the last minute or the leaves go sad.'
  },
  {
    id: 'risotto',
    mins: 35,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['rice'] },
      { kind: 'veg', min: 1, max: 2, only: ['mushroom', 'peas', 'squash', 'asparagus', 'leek', 'courgette', 'spinach', 'onion', 'beetroot'] },
      { kind: 'protein', min: 0, max: 1, only: ['chicken', 'bacon', 'prawns', 'chorizo', 'cookedchicken'] },
      { kind: 'dairy', min: 0, max: 1, only: ['parmesan', 'butter', 'cream', 'mozzarella'] }
    ],
    name: p => cap(picked(p, 'veg', 1)[0] ?? 'plain') + ' risotto',
    note: () => "Stock in a ladle at a time. Stir it, but you needn't stand over it."
  },
  {
    id: 'omelette',
    mins: 18,
    slots: [
      { kind: 'protein', min: 1, max: 1, only: ['eggs'] },
      { kind: 'veg', min: 0, max: 3, only: ['mushroom', 'pepper', 'onion', 'spinach', 'tomato', 'courgette', 'potato', 'peas', 'springonion', 'asparagus', 'leek'] },
      { kind: 'sauce', min: 0, max: 1, only: ['tintom'] },
      { kind: 'dairy', min: 0, max: 1, only: ['cheddar', 'feta', 'parmesan', 'mozzarella'] },
      { kind: 'protein', min: 0, max: 1, only: ['ham', 'bacon', 'chorizo', 'smokedsalmon', 'cookedchicken'] }
    ],
    name: p => cap(join(picked(p, 'veg', 2)) || picked(p, 'dairy', 1)[0] || 'plain') + ' omelette',
    note: () => 'Low heat, and off the pan while the middle still looks slightly unfinished.'
  },
  {
    id: 'toastie',
    mins: 12,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['bread', 'tortilla'] },
      { kind: 'dairy', min: 0, max: 1, only: ['cheddar', 'mozzarella', 'feta', 'creamcheese'] },
      { kind: 'protein', min: 1, max: 1, only: ['ham', 'bacon', 'chicken', 'cookedchicken', 'tuna', 'chorizo', 'smokedsalmon', 'eggs', 'hummus', 'cheddar'] },
      { kind: 'veg', min: 0, max: 2, only: ['tomato', 'onion', 'lettuce', 'rocket', 'cucumber', 'pepper', 'mushroom', 'spinach', 'avocado'] }
    ],
    name: p => cap(join([...picked(p, 'dairy', 1), ...picked(p, 'protein', 1)])) + ' toastie',
    note: () => 'Butter the outside of the bread, not the inside.'
  },
  {
    // Nothing cooked at all. The genuinely quick option, and the one the
    // shapes were missing when the time filter found nothing under 15.
    id: 'sandwich',
    mins: 8,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['bread', 'naan', 'crackers'] },
      { kind: 'protein', min: 1, max: 1, only: ['ham', 'cookedchicken', 'chicken', 'tuna', 'eggs', 'salami', 'cheddar', 'hummus', 'smokedsalmon', 'mackerel', 'sardines', 'creamcheese', 'cottagecheese'] },
      { kind: 'veg', min: 0, max: 2, only: ['lettuce', 'tomato', 'cucumber', 'rocket', 'watercress', 'avocado', 'springonion', 'pepper'] },
      { kind: 'sauce', min: 0, max: 1, only: ['mayo', 'harissa', 'pesto'] }
    ],
    name: p => cap(picked(p, 'protein', 1)[0] ?? 'a') + ' sandwich',
    note: () => 'Assembly, not cooking. Season the tomato if there is one.'
  },
  {
    id: 'wrap',
    mins: 10,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['tortilla', 'naan'] },
      { kind: 'protein', min: 1, max: 1, only: ['chicken', 'cookedchicken', 'halloumi', 'chickpeas', 'beans', 'tuna', 'eggs', 'hummus', 'salami', 'ham', 'tofu', 'mince'] },
      { kind: 'veg', min: 1, max: 3, only: ['lettuce', 'tomato', 'cucumber', 'pepper', 'rocket', 'avocado', 'springonion', 'watercress', 'cabbage'] },
      { kind: 'dairy', min: 0, max: 1, only: ['cheddar', 'feta', 'yoghurt'] },
      { kind: 'sauce', min: 0, max: 1, only: ['harissa', 'mayo', 'tahini', 'pesto'] }
    ],
    name: p => cap(picked(p, 'protein', 1)[0] ?? 'veg') + ' wrap',
    note: () => 'Warm the wrap for ten seconds and it stops splitting.'
  },
  {
    id: 'quesadilla',
    mins: 12,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['tortilla'] },
      { kind: 'dairy', min: 1, max: 1, only: ['cheddar', 'mozzarella'] },
      { kind: 'protein', min: 0, max: 1, only: ['chicken', 'cookedchicken', 'beans', 'chorizo', 'mince', 'salami', 'ham'] },
      { kind: 'veg', min: 0, max: 2, only: ['pepper', 'onion', 'springonion', 'sweetcorn', 'mushroom', 'spinach'] }
    ],
    name: p => cap(picked(p, 'protein', 1)[0] ?? 'cheese') + ' quesadilla',
    note: () => 'Dry pan, cheese to the edges, press it down and flip once.'
  },
  {
    id: 'toast',
    mins: 8,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['bread'] },
      { kind: 'protein', min: 1, max: 1, only: ['beans', 'eggs', 'smokedsalmon', 'hummus', 'tuna', 'cheddar', 'mushroom', 'avocado', 'peanutbutter', 'creamcheese'] },
      { kind: 'veg', min: 0, max: 1, only: ['tomato', 'mushroom', 'avocado', 'spinach', 'rocket'] }
    ],
    name: p => cap(picked(p, 'protein', 1)[0] ?? 'something') + ' on toast',
    note: () => 'Toast first, topping second, and season it properly.'
  },
  {
    id: 'bowl',
    mins: 30,
    slots: [
      { kind: 'base', min: 1, max: 1, only: ['rice', 'couscous', 'noodles', 'potato'] },
      { kind: 'protein', min: 1, max: 1, only: ['chicken', 'chickenthigh', 'beans', 'chickpeas', 'halloumi', 'tofu', 'salmon', 'prawns', 'eggs', 'lentils', 'cookedchicken', 'turkey'] },
      { kind: 'veg', min: 0, max: 3, only: ['pepper', 'broccoli', 'carrot', 'sweetpotato', 'avocado', 'cucumber', 'tomato', 'spinach', 'courgette', 'squash', 'peas', 'rocket', 'beetroot'] },
      { kind: 'dairy', min: 0, max: 1, only: ['feta', 'yoghurt', 'halloumi'] },
      { kind: 'aroma', min: 0, max: 2, only: ['lemon', 'lime', 'coriander', 'chilli', 'garlic'] }
    ],
    name: p => cap(join([...picked(p, 'protein', 1), ...picked(p, 'veg', 1)])) + ' bowl',
    note: () => 'Roast what wants roasting, keep the rest raw, and build it in the bowl.'
  },
  {
    id: 'pudding',
    mins: 20,
    slots: [
      { kind: 'fruit', min: 1, max: 3 },
      { kind: 'dairy', min: 0, max: 1, only: ['yoghurt', 'cream', 'cremefraiche'] },
      { kind: 'base', min: 0, max: 1, only: ['bread'] }
    ],
    name: p => cap(join(picked(p, 'fruit', 2))) +
      ((p.dairy ?? []).length ? ' with ' + cookName(p.dairy[0].key) : ''),
    note: () => 'The point is using the fruit up before it turns.'
  }
]

/**
 * Where the generated name would be daft, use the name everyone knows.
 * A combination people already have a name for is also more likely to be
 * what they want, so the planner gives these a scoring bonus too.
 */
export const CLASSICS = [
  { shape: 'grill', keys: ['sausages', 'bacon', 'eggs'], name: 'Full English' },
  { shape: 'grill', keys: ['gammon', 'eggs'], name: 'Gammon, egg and chips' },
  { shape: 'grill', keys: ['whitefish', 'ovenchips'], name: 'Fish and chips' },
  { shape: 'grill', keys: ['whitefish', 'potato'], name: 'Fish and chips' },
  { shape: 'grill', keys: ['sausages', 'potato'], name: 'Bangers and mash' },
  { shape: 'pasta', keys: ['eggs', 'bacon'], name: 'Carbonara' },
  { shape: 'pasta', keys: ['mince', 'tintom'], name: 'Spaghetti bolognese' },
  { shape: 'pasta', keys: ['cheddar', 'milk'], name: 'Macaroni cheese' },
  { shape: 'pasta', keys: ['prawns', 'chilli'], name: 'Prawn and chilli linguine' },
  { shape: 'pasta', keys: ['tuna', 'sweetcorn'], name: 'Tuna pasta bake' },
  { shape: 'curry', keys: ['mince', 'beans'], name: 'Chilli con carne' },
  { shape: 'curry', keys: ['chickenthigh', 'coconutmilk'], name: 'Thai-style green curry' },
  { shape: 'curry', keys: ['chickpeas', 'spinach'], name: 'Chickpea and spinach curry' },
  { shape: 'curry', keys: ['lentils'], name: 'Dhal' },
  { shape: 'soup', keys: ['potato', 'leek'], name: 'Leek and potato soup' },
  { shape: 'soup', keys: ['broccoli', 'cheddar'], name: 'Broccoli and cheddar soup' },
  { shape: 'soup', keys: ['tintom', 'onion'], name: 'Tomato soup' },
  { shape: 'salad', keys: ['tuna', 'potato', 'eggs'], name: 'Tuna niçoise-ish' },
  { shape: 'salad', keys: ['feta', 'cucumber', 'tomato'], name: 'Greek-ish salad' },
  { shape: 'salad', keys: ['chicken', 'lettuce', 'bread'], name: 'Caesar-ish salad' },
  { shape: 'traybake', keys: ['chicken', 'potato', 'carrot'], name: 'Roast dinner' },
  { shape: 'traybake', keys: ['aubergine', 'tintom', 'mozzarella'], name: 'Aubergine parmigiana' },
  { shape: 'traybake', keys: ['gnocchi', 'tintom', 'mozzarella'], name: 'Gnocchi al pomodoro' },
  { shape: 'traybake', keys: ['mince', 'potato'], name: "Shepherd's pie" },
  { shape: 'stirfry', keys: ['rice', 'eggs', 'peas'], name: 'Egg fried rice' },
  { shape: 'omelette', keys: ['potato', 'onion'], name: 'Spanish omelette' },
  { shape: 'omelette', keys: ['tintom', 'pepper'], name: 'Shakshuka' },
  { shape: 'toastie', keys: ['cheddar', 'ham'], name: 'Cheese and ham toastie' },
  { shape: 'sandwich', keys: ['cheddar', 'tomato'], name: 'Cheese and tomato sandwich' },
  { shape: 'sandwich', keys: ['tuna', 'cucumber'], name: 'Tuna sandwich' },
  { shape: 'wrap', keys: ['chicken', 'lettuce'], name: 'Chicken wrap' },
  { shape: 'wrap', keys: ['halloumi', 'pepper'], name: 'Halloumi wrap' },
  { shape: 'toast', keys: ['avocado', 'eggs'], name: 'Avocado and egg on toast' },
  { shape: 'toast', keys: ['beans'], name: 'Beans on toast' },
  { shape: 'toast', keys: ['cheddar'], name: 'Cheese on toast' },
  { shape: 'toast', keys: ['smokedsalmon'], name: 'Smoked salmon on toast' },
  { shape: 'risotto', keys: ['mushroom'], name: 'Mushroom risotto' },
  { shape: 'bowl', keys: ['sweetpotato', 'beans'], name: 'Sweet potato and bean bowl' }
].sort((a, b) => b.keys.length - a.keys.length) // most specific match wins

export { labelOf }
