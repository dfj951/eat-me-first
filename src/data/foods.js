/**
 * THE FOOD CATALOGUE
 *
 * One row per food:  [key, label, category, fridge days, meals it stretches to]
 *
 *   key     what the code calls it. Never shown on screen.
 *   label   what a person calls it when shopping. "Chicken breasts".
 *   days    how long it typically keeps unopened in a cold fridge.
 *   uses    roughly how many meals one purchase covers, so a bag of
 *           onions doesn't vanish after a single dinner.
 *
 * Everything here is static. This file is the reason the app needs no
 * internet connection.
 */

const ROWS = [
  // dairy and eggs
  ['milk', 'Milk', 'dairy', 7, 5],
  ['yoghurt', 'Yoghurt', 'dairy', 10, 3],
  ['cream', 'Cream', 'dairy', 5, 2],
  ['cremefraiche', 'Crème fraîche', 'dairy', 10, 3],
  ['butter', 'Butter', 'dairy', 30, 10],
  ['cheddar', 'Cheddar', 'dairy', 21, 5],
  ['parmesan', 'Parmesan', 'dairy', 60, 8],
  ['mozzarella', 'Mozzarella', 'dairy', 10, 2],
  ['feta', 'Feta', 'dairy', 21, 3],
  ['halloumi', 'Halloumi', 'dairy', 30, 2],
  ['creamcheese', 'Cream cheese', 'dairy', 14, 4],
  ['eggs', 'Eggs', 'dairy', 21, 6],
  ['tofu', 'Tofu', 'dairy', 10, 2],
  ['hummus', 'Hummus', 'dairy', 7, 3],

  // meat
  ['chicken', 'Chicken breasts', 'meat', 3, 2],
  ['chickenthigh', 'Chicken thighs', 'meat', 3, 2],
  ['cookedchicken', 'Cooked chicken', 'meat', 3, 2],
  ['mince', 'Beef mince', 'meat', 3, 2],
  ['porkmince', 'Pork mince', 'meat', 3, 2],
  ['steak', 'Steak', 'meat', 3, 1],
  ['lambchops', 'Lamb chops', 'meat', 3, 2],
  ['porkchops', 'Pork chops', 'meat', 3, 2],
  ['gammon', 'Gammon', 'meat', 7, 2],
  ['turkey', 'Turkey', 'meat', 3, 3],
  ['burgers', 'Burgers', 'meat', 3, 2],
  ['sausages', 'Sausages', 'meat', 4, 2],
  ['bacon', 'Bacon', 'meat', 7, 3],
  ['ham', 'Ham', 'meat', 5, 3],
  ['chorizo', 'Chorizo', 'meat', 21, 4],

  // fish
  ['salmon', 'Salmon', 'fish', 2, 2],
  ['whitefish', 'White fish', 'fish', 2, 2],
  ['prawns', 'Prawns', 'fish', 2, 2],
  ['smokedsalmon', 'Smoked salmon', 'fish', 5, 2],
  ['fishfingers', 'Fish fingers', 'fish', 2, 2],

  // vegetables
  ['onion', 'Onion', 'veg', 30, 4],
  ['garlic', 'Garlic', 'veg', 60, 10],
  ['carrot', 'Carrots', 'veg', 21, 4],
  ['potato', 'Potatoes', 'veg', 21, 5],
  ['sweetpotato', 'Sweet potato', 'veg', 21, 3],
  ['tomato', 'Tomatoes', 'veg', 7, 3],
  ['pepper', 'Peppers', 'veg', 10, 3],
  ['courgette', 'Courgette', 'veg', 7, 2],
  ['aubergine', 'Aubergine', 'veg', 7, 2],
  ['mushroom', 'Mushrooms', 'veg', 5, 2],
  ['broccoli', 'Broccoli', 'veg', 7, 2],
  ['cauliflower', 'Cauliflower', 'veg', 7, 2],
  ['spinach', 'Spinach', 'veg', 4, 2],
  ['kale', 'Kale', 'veg', 5, 2],
  ['lettuce', 'Lettuce', 'veg', 5, 3],
  ['rocket', 'Rocket', 'veg', 4, 2],
  ['cucumber', 'Cucumber', 'veg', 7, 3],
  ['celery', 'Celery', 'veg', 14, 4],
  ['leek', 'Leeks', 'veg', 10, 3],
  ['cabbage', 'Cabbage', 'veg', 14, 4],
  ['peas', 'Peas', 'veg', 120, 5],
  ['greenbeans', 'Green beans', 'veg', 7, 2],
  ['sugarsnap', 'Sugar snap peas', 'veg', 7, 2],
  ['springonion', 'Spring onions', 'veg', 7, 3],
  ['chilli', 'Chillies', 'veg', 10, 5],
  ['ginger', 'Ginger', 'veg', 21, 6],
  ['squash', 'Butternut squash', 'veg', 30, 3],
  ['avocado', 'Avocado', 'veg', 4, 1],
  ['asparagus', 'Asparagus', 'veg', 4, 2],
  ['parsnip', 'Parsnips', 'veg', 21, 3],
  ['fennel', 'Fennel', 'veg', 10, 2],
  ['sprouts', 'Brussels sprouts', 'veg', 10, 3],
  ['beetroot', 'Beetroot', 'veg', 21, 3],
  ['sweetcorn', 'Sweetcorn', 'veg', 700, 2],

  // fruit
  ['lemon', 'Lemon', 'fruit', 21, 4],
  ['lime', 'Lime', 'fruit', 21, 4],
  ['apple', 'Apples', 'fruit', 21, 4],
  ['banana', 'Bananas', 'fruit', 5, 3],
  ['berries', 'Berries', 'fruit', 4, 2],
  ['orange', 'Oranges', 'fruit', 21, 4],
  ['grapes', 'Grapes', 'fruit', 7, 3],
  ['melon', 'Melon', 'fruit', 5, 3],
  ['pineapple', 'Pineapple', 'fruit', 5, 3],
  ['mango', 'Mango', 'fruit', 5, 2],
  ['pear', 'Pears', 'fruit', 10, 3],
  ['plum', 'Plums', 'fruit', 7, 3],

  // things that go stale rather than off
  ['bread', 'Bread', 'carb', 5, 5],
  ['tortilla', 'Tortillas', 'carb', 14, 3],
  ['gnocchi', 'Gnocchi', 'carb', 30, 2],
  ['pastry', 'Pastry', 'carb', 14, 2],
  ['ovenchips', 'Oven chips', 'carb', 200, 3],

  // cupboard: keeps for ever, so cheap to be missing
  ['pasta', 'Pasta', 'cupboard', 400, 5],
  ['rice', 'Rice', 'cupboard', 400, 6],
  ['noodles', 'Noodles', 'cupboard', 200, 4],
  ['couscous', 'Couscous', 'cupboard', 400, 4],
  ['lentils', 'Lentils', 'cupboard', 400, 4],
  ['chickpeas', 'Chickpeas', 'cupboard', 700, 2],
  ['beans', 'Tinned beans', 'cupboard', 700, 2],
  ['tintom', 'Tinned tomatoes', 'cupboard', 700, 2],
  ['coconutmilk', 'Coconut milk', 'cupboard', 700, 2],
  ['currypaste', 'Curry paste', 'cupboard', 90, 5],
  ['tuna', 'Tinned tuna', 'cupboard', 700, 2],
  ['pesto', 'Pesto', 'cupboard', 30, 4],
  ['olives', 'Olives', 'cupboard', 60, 4],
  ['peanutbutter', 'Peanut butter', 'cupboard', 180, 8],
  ['honey', 'Honey', 'cupboard', 700, 20],

  // herbs
  ['basil', 'Basil', 'herb', 5, 3],
  ['coriander', 'Coriander', 'herb', 5, 3],
  ['parsley', 'Parsley', 'herb', 6, 3],
  ['mint', 'Mint', 'herb', 6, 3],

  // odds and ends
  ['juice', 'Juice', 'other', 7, 4],
  ['leftovers', 'Leftovers', 'other', 3, 1]
]

/** Every food, keyed for instant lookup: FOODS.spinach.label === 'Spinach' */
export const FOODS = {}
for (const [key, label, cat, days, uses] of ROWS) {
  FOODS[key] = { key, label, cat, days, uses }
}

/** The same foods as a list, for searching and looping. */
export const FOOD_LIST = Object.values(FOODS)

/**
 * The words people actually type.
 *
 * Without these, searching "cheese" or "yogurt" finds nothing at all,
 * which is worse than useless. Learned the hard way.
 */
export const ALIASES = {
  milk: ['semi skimmed', 'whole milk', 'oat milk', 'skimmed'],
  yoghurt: ['yogurt', 'greek yoghurt', 'greek yogurt'],
  cremefraiche: ['creme fraiche', 'soured cream', 'sour cream'],
  cheddar: ['cheese', 'grated cheese', 'block of cheese'],
  parmesan: ['parmigiano', 'pecorino', 'hard cheese'],
  mozzarella: ['buffalo mozzarella', 'pizza cheese'],
  creamcheese: ['philadelphia', 'soft cheese'],
  eggs: ['egg', 'half a dozen'],
  butter: ['margarine', 'marg', 'spread'],
  chicken: ['chicken breast', 'chicken fillets', 'chicken breasts'],
  chickenthigh: ['thighs', 'chicken legs', 'drumsticks'],
  cookedchicken: ['leftover chicken', 'roast chicken'],
  mince: ['ground beef', 'minced beef', 'beef mince', 'steak mince'],
  porkmince: ['ground pork', 'minced pork'],
  steak: ['sirloin', 'ribeye', 'rib eye', 'rump', 'fillet steak', 'frying steak'],
  lambchops: ['lamb', 'lamb chop', 'cutlets'],
  porkchops: ['pork', 'pork chop', 'pork loin', 'chops'],
  gammon: ['ham joint', 'bacon joint', 'gammon steak'],
  turkey: ['turkey breast', 'turkey mince'],
  burgers: ['burger', 'beef burgers', 'patties'],
  sausages: ['bangers', 'chipolatas'],
  bacon: ['rashers', 'streaky', 'back bacon'],
  ham: ['sliced ham', 'cooked ham'],
  prawns: ['shrimp', 'king prawns'],
  whitefish: ['cod', 'haddock', 'pollock', 'fish', 'basa'],
  salmon: ['salmon fillet', 'salmon fillets'],
  smokedsalmon: ['lox', 'smoked fish'],
  fishfingers: ['fish finger'],
  courgette: ['zucchini'],
  aubergine: ['eggplant'],
  pepper: ['bell pepper', 'bell peppers', 'peppers', 'capsicum', 'red pepper'],
  springonion: ['scallion', 'scallions', 'green onion', 'salad onion'],
  coriander: ['cilantro'],
  rocket: ['arugula', 'salad leaves'],
  lettuce: ['salad', 'gem', 'iceberg', 'romaine', 'bag of salad'],
  tomato: ['cherry tomatoes', 'vine tomatoes', 'toms'],
  potato: ['new potatoes', 'spuds', 'maris piper', 'roasties'],
  sweetpotato: ['yam'],
  squash: ['butternut'],
  mushroom: ['chestnut mushrooms', 'button mushrooms'],
  greenbeans: ['french beans', 'fine beans'],
  peas: ['frozen peas', 'garden peas'],
  sugarsnap: ['mangetout', 'snap peas'],
  chickpeas: ['garbanzo', 'garbanzos'],
  beans: ['baked beans', 'kidney beans', 'black beans', 'cannellini', 'butter beans'],
  tintom: ['chopped tomatoes', 'tinned tomato', 'passata', 'plum tomatoes'],
  lentils: ['red lentils', 'puy lentils', 'dal', 'dhal'],
  pasta: ['spaghetti', 'penne', 'fusilli', 'macaroni', 'linguine', 'tagliatelle'],
  rice: ['basmati', 'long grain', 'risotto rice', 'arborio'],
  noodles: ['egg noodles', 'ramen', 'rice noodles', 'udon'],
  bread: ['loaf', 'toast', 'sourdough', 'baguette', 'rolls', 'bap'],
  tortilla: ['wraps', 'wrap', 'tortillas', 'flatbread', 'pitta'],
  ovenchips: ['chips', 'frozen chips', 'fries', 'french fries'],
  tuna: ['tin of tuna', 'canned tuna'],
  coconutmilk: ['tin of coconut', 'coconut cream'],
  currypaste: ['thai paste', 'green curry paste', 'red curry paste'],
  avocado: ['avo', 'avocados'],
  berries: ['strawberries', 'raspberries', 'blueberries', 'blackberries'],
  banana: ['bananas'],
  lemon: ['lemons'],
  lime: ['limes'],
  apple: ['apples'],
  orange: ['oranges', 'satsuma', 'clementine'],
  leftovers: ['last night', 'leftover']
}

/**
 * "Chicken breasts" is how you buy it. "chicken" is how you say it in
 * the name of a dish. Only foods where those differ are listed here.
 */
export const COOK_NAMES = {
  chicken: 'chicken', chickenthigh: 'chicken thigh', cookedchicken: 'cooked chicken',
  mince: 'beef', porkmince: 'pork', lambchops: 'lamb chops', porkchops: 'pork chop',
  sausages: 'sausage', burgers: 'burger', prawns: 'prawn', whitefish: 'fish',
  fishfingers: 'fish finger', eggs: 'egg', carrot: 'carrot', potato: 'potato',
  tomato: 'tomato', pepper: 'pepper', mushroom: 'mushroom', leek: 'leek',
  chilli: 'chilli', springonion: 'spring onion', greenbeans: 'green bean',
  parsnip: 'parsnip', sprouts: 'sprout', sugarsnap: 'sugar snap', peas: 'pea',
  berries: 'berry', apple: 'apple', banana: 'banana', orange: 'orange',
  pear: 'pear', plum: 'plum', grapes: 'grape', tintom: 'tomato', beans: 'bean',
  chickpeas: 'chickpea', lentils: 'lentil', noodles: 'noodle', olives: 'olive',
  ovenchips: 'chips', cremefraiche: 'crème fraîche', creamcheese: 'cream cheese'
}

/* ── the freezer ──────────────────────────────────────────────────────
   Days a thing keeps frozen. Zero means it comes back wrong: salad goes
   to slime, potatoes go gritty, eggs burst and yoghurt splits. Better to
   refuse than to ruin someone's dinner on our advice.                  */

const FREEZE_BY_CAT = {
  meat: 180, fish: 90, dairy: 90, veg: 240, fruit: 240,
  carb: 90, herb: 120, cupboard: 365, other: 90
}

const FREEZE_OVERRIDE = {
  lettuce: 0, cucumber: 0, rocket: 0, avocado: 0, potato: 0, eggs: 0,
  yoghurt: 0, cremefraiche: 0, creamcheese: 0, hummus: 0, melon: 0,
  milk: 90, cream: 60, butter: 270, cheddar: 180, parmesan: 270,
  mozzarella: 120, feta: 90, halloumi: 120, tofu: 150,
  bread: 90, pastry: 180, gnocchi: 90, tortilla: 90, ovenchips: 365,
  bacon: 60, chorizo: 120, ham: 60, cookedchicken: 90, smokedsalmon: 60,
  steak: 180, lambchops: 180, porkchops: 180, gammon: 180, turkey: 180,
  burgers: 180, fishfingers: 180,
  banana: 180, berries: 360, mango: 240, grapes: 180, pineapple: 240,
  tomato: 180, mushroom: 90, leftovers: 90
}

/** How many days this food keeps frozen. 0 means don't. */
export function freezeLife (key) {
  if (key in FREEZE_OVERRIDE) return FREEZE_OVERRIDE[key]
  const food = FOODS[key]
  if (!food) return 90
  return FREEZE_BY_CAT[food.cat] ?? 90
}

export const canFreeze = key => freezeLife(key) > 0

/** Meat and fish want using the day they thaw. Everything else, a few days. */
export function thawLife (key) {
  const food = FOODS[key]
  return food && (food.cat === 'meat' || food.cat === 'fish') ? 1 : 3
}

/** Cupboard staples are cheap to be missing — you probably have some. */
export const isCupboard = key => FOODS[key]?.cat === 'cupboard'

/** The shopping label. Falls back to the key for hand-typed items. */
export const labelOf = key => FOODS[key]?.label ?? key

/** The word to use inside the name of a dish. */
export const cookName = key => (COOK_NAMES[key] ?? labelOf(key)).toLowerCase()
