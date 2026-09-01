/**
 * The fridge panel: searching for food, the quick-add chips, and the
 * list itself sorted by what dies first.
 */

import { FOODS, canFreeze } from '../data/foods.js'
import { searchFoods } from '../lib/search.js'
import { daysLeft, daysText, urgency, shortDate } from '../lib/dates.js'
import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

/**
 * What the chips show before you've added anything. Once you have, your
 * own recent additions take over — after a week it's your actual
 * shopping rather than my guess at it.
 */
const STARTERS = ['milk', 'eggs', 'chicken', 'spinach', 'tomato', 'bread',
  'cheddar', 'mushroom', 'pasta', 'rice', 'potato', 'onion']

const CHIP_COUNT = 12

/* What a hand-typed food can be, in the words a person would use rather
   than the ones the engine uses internally. */
const ROLE_CHOICES = [
  ['', 'What is it?'],
  ['protein', 'Meat, fish or protein'],
  ['veg', 'Vegetable'],
  ['base', 'Pasta, rice, bread or potatoes'],
  ['dairy', 'Cheese or dairy'],
  ['sauce', 'Sauce, tin or paste'],
  ['aroma', 'Herb or flavouring'],
  ['fruit', 'Fruit'],
  ['none', 'Just track the date']
]

let matches = []
let highlighted = -1

export function mountFridge () {
  const search = document.getElementById('find')
  const hits = document.getElementById('hits')

  /* ── the search box ──────────────────────────────────────────────── */

  function draw () {
    const typed = search.value.trim()
    if (!typed) return close()

    matches = searchFoods(typed)

    const rows = matches.map((food, i) => `
      <button class="hit" type="button" data-i="${i}" ${i === highlighted ? 'data-hi="1"' : ''}>
        <b>${esc(food.label)}</b>
        <span>keeps about ${food.days > 90 ? 'for ever' : food.days + ' days'}</span>
      </button>`)

    // Whatever they typed can always be added. Never a dead end.
    rows.push(`
      <button class="hit own" type="button" data-own="1"
              ${highlighted === matches.length ? 'data-hi="1"' : ''}>
        <b>Add &ldquo;${esc(typed)}&rdquo;</b>
        <span>${matches.length ? 'something else' : 'not in the food list'}</span>
      </button>`)

    hits.innerHTML = rows.join('')
    hits.dataset.open = '1'
    search.setAttribute('aria-expanded', 'true')
  }

  function close () {
    hits.dataset.open = '0'
    search.setAttribute('aria-expanded', 'false')
    highlighted = -1
  }

  function pick (index) {
    if (index === matches.length || !matches.length) {
      state.addUnknown(search.value)
    } else {
      state.addFood(matches[index].key)
    }
    search.value = ''
    close()
  }

  search.addEventListener('input', () => { highlighted = -1; draw() })

  search.addEventListener('keydown', e => {
    if (hits.dataset.open !== '1') return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); highlighted = Math.min(highlighted + 1, matches.length); draw()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); highlighted = Math.max(highlighted - 1, 0); draw()
    } else if (e.key === 'Enter') {
      e.preventDefault(); pick(highlighted < 0 ? matches.length : highlighted)
    } else if (e.key === 'Escape') {
      close()
    }
  })

  hits.addEventListener('click', e => {
    const button = e.target.closest('.hit')
    if (!button) return
    pick(button.dataset.own ? matches.length : Number(button.dataset.i))
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.finder')) close()
  })

  document.getElementById('chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip')
    if (chip) state.addFood(chip.dataset.k)
  })

  document.getElementById('empty')
    .addEventListener('click', () => state.emptyFridge())
}

/** One tap for whatever you keep buying, padded with basics early on. */
export function renderChips () {
  const seen = new Set()
  const keys = []

  for (const key of [...state.recent, ...STARTERS]) {
    if (FOODS[key] && !seen.has(key)) {
      seen.add(key)
      keys.push(key)
    }
    if (keys.length === CHIP_COUNT) break
  }

  document.getElementById('chipsLabel').textContent =
    state.recent.length ? 'Recently added' : 'To get you started'

  document.getElementById('chips').innerHTML = keys
    .map(key => `<button class="chip" type="button" data-k="${key}">${esc(FOODS[key].label)}</button>`)
    .join('')
}

/** Redraw the list. Called by main.js whenever the state changes. */
export function renderFridge () {
  const host = document.getElementById('listHost')
  const count = document.getElementById('count')
  const items = state.fridge

  count.textContent = items.length
    ? items.length + (items.length === 1 ? ' thing' : ' things')
    : ''

  if (!items.length) {
    host.innerHTML = '<p class="nothing">Nothing in here yet.</p>'
    return
  }

  const sorted = [...items].sort((a, b) => daysLeft(a.date) - daysLeft(b.date))

  host.innerHTML = `<div class="items">${sorted.map(item => {
    const days = daysLeft(item.date)
    const name = state.nameOf(item)
    const uses = state.usesOf(item)
    const freezable = canFreeze(item.key)
    const tip = item.frozen
      ? 'Take out of the freezer'
      : freezable ? 'Put in the freezer' : `${name} won’t freeze well`

    return `
      <div class="item u-${urgency(days)}${item.frozen ? ' frozen' : ''}">
        <span class="tick"></span>
        <div class="nm">
          <b>${esc(name)}</b>
          <div class="sub">
            <small>${item.frozen
              ? `frozen &middot; good to ${shortDate(item.date)}`
              : esc(daysText(days))}</small>
            ${state.isUnknown(item) ? `
              <select class="role" data-role="${item.id}"
                      aria-label="What kind of food is ${esc(name)}?">
                ${ROLE_CHOICES.map(([value, text]) => `
                  <option value="${value}" ${
                    (item.role ?? (item.roleSet ? 'none' : '')) === value ? 'selected' : ''
                  }>${esc(text)}</option>`).join('')}
              </select>` : ''}
            <span class="qty" title="Roughly how many meals this will stretch to">
              <button type="button" data-less="${item.id}" aria-label="Less ${esc(name)}"
                      ${uses <= 1 ? 'disabled' : ''}>&minus;</button>
              <b>${uses}</b>
              <button type="button" data-more="${item.id}" aria-label="More ${esc(name)}">+</button>
              <span class="unit">meal${uses === 1 ? '' : 's'}</span>
            </span>
          </div>
        </div>
        <input type="date" value="${item.date}" data-date="${item.id}"
               aria-label="Date for ${esc(name)}">
        <button class="snow" type="button" data-freeze="${item.id}"
                ${item.frozen ? 'data-on="1"' : ''} ${freezable || item.frozen ? '' : 'disabled'}
                title="${esc(tip)}" aria-label="${item.frozen ? 'Thaw' : 'Freeze'} ${esc(name)}">&#10052;</button>
        <button class="bin" type="button" data-remove="${item.id}"
                aria-label="Remove ${esc(name)}">&times;</button>
      </div>`
  }).join('')}</div>`

  host.querySelectorAll('[data-role]').forEach(select =>
    select.addEventListener('change', () =>
      state.setRole(Number(select.dataset.role), select.value === 'none' ? null : select.value)))

  host.querySelectorAll('[data-date]').forEach(input =>
    input.addEventListener('change', () => state.setDate(Number(input.dataset.date), input.value)))

  const step = (button, attr, by) => {
    const id = Number(button.dataset[attr])
    state.setUses(id, state.usesOf(state.fridge.find(i => i.id === id)) + by)
  }
  host.querySelectorAll('[data-less]').forEach(b =>
    b.addEventListener('click', () => step(b, 'less', -1)))
  host.querySelectorAll('[data-more]').forEach(b =>
    b.addEventListener('click', () => step(b, 'more', +1)))

  host.querySelectorAll('[data-freeze]').forEach(button =>
    button.addEventListener('click', () => {
      const id = Number(button.dataset.freeze)
      const item = state.fridge.find(i => i.id === id)
      if (item?.frozen) state.thaw(id); else state.freeze(id)
    }))

  host.querySelectorAll('[data-remove]').forEach(button =>
    button.addEventListener('click', () => state.removeItem(Number(button.dataset.remove))))
}
