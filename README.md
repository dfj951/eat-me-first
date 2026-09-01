# Eat Me First

Tell it what's in your fridge and when it goes off. It works out what to cook
tonight — and every night this week — so nothing dies in the drawer.

Runs entirely in the browser. No account, no server, no API. Nothing you type
leaves your device.

## Running it

```bash
npm install     # once
npm run dev     # then open the URL it prints
```

`npm run build` produces the deployable site in `dist/`.

## How it works

There is no recipe database. Instead:

1. **Every ingredient is tagged with a role** — a protein, a base, a vegetable,
   something to finish with (`src/data/mealShapes.js`).
2. **A dozen meal shapes** say how those roles fit together. A stir fry is one
   base, one protein, two or three of the right vegetables.
3. **The planner fills the slots** from what's actually in the fridge, always
   preferring whatever is closest to dying (`src/lib/planner.js`).

The rule the whole thing turns on: *an ingredient going off tomorrow is worth
about twenty times one that keeps for a week.* Cooking a meal takes its
ingredients off the shelf before the next day is planned, which is what stops it
proposing spinach five nights running.

Where a combination has a name people already use — carbonara, bangers and mash —
a lookup table renames it and gives it a scoring bonus, because a dish you can
name is more likely to be the one you want.

## The files

```
src/
├─ data/
│  ├─ foods.js        the food catalogue: labels, shelf life, aliases, freezer
│  └─ mealShapes.js   ingredient roles, the meal shapes, the classics
├─ lib/
│  ├─ dates.js        everything is a 'YYYY-MM-DD' string and whole days
│  ├─ search.js       finding food by what people actually type
│  ├─ planner.js      the scoring, and the seven-day plan
│  └─ store.js        localStorage, wrapped so it can't throw
├─ ui/
│  ├─ fridge.js       the fridge panel
│  ├─ plan.js         the week
│  ├─ mymeals.js      meals you save yourself
│  └─ html.js         escaping, so typed names can't inject markup
├─ state.js           owns the data; the UI calls it and redraws on change
├─ main.js            wires the three panels together
└─ style.css          all the styling, themed with CSS variables
```

`tools/make-icons.py` regenerates the app icons with no image library —
just `zlib` and `struct`.

## On your phone

Open the built site in Safari, then Share → Add to Home Screen. It runs full
screen with its own icon and works with no signal.

## Not done yet

- Barcode scanning (needs a WASM scanner — Safari has no built-in barcode API)
- Portion sizes: half a bag of spinach and a whole one are currently the same
- A shopping list you can take to the shop
