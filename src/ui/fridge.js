/**
 * The fridge panel: searching for food, the quick-add chips, and the
 * list itself sorted by what dies first.
 */

import { FOODS, canFreeze } from '../data/foods.js'
import { searchFoods } from '../lib/search.js'
import { daysLeft, daysText, urgency, shortDate } from '../lib/dates.js'
import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

const QUICK_ADD = ['milk', 'eggs', 'chicken', 'spinach', 'tomato', 'bread',
  'cheddar', 'mushroom', 'yoghurt', 'pepper', 'potato', 'onion']

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

  /* ── one tap for the things that actually rot ────────────────────── */

  const chips = document.getElementById('chips')
  chips.innerHTML = QUICK_ADD
    .map(key => `<button class="chip" type="button" data-k="${key}">${esc(FOODS[key].label)}</button>`)
    .join('')
  chips.addEventListener('click', e => {
    const chip = e.target.closest('.chip')
    if (chip) state.addFood(chip.dataset.k)
  })

  document.getElementById('empty')
    .addEventListener('click', () => state.emptyFridge())
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
    const freezable = canFreeze(item.key)
    const tip = item.frozen
      ? 'Take out of the freezer'
      : freezable ? 'Put in the freezer' : `${name} won’t freeze well`

    return `
      <div class="item u-${urgency(days)}${item.frozen ? ' frozen' : ''}">
        <span class="tick"></span>
        <span class="nm">
          <b>${esc(name)}</b>
          <small>${item.frozen ? `frozen &middot; good to ${shortDate(item.date)}` : esc(daysText(days))}</small>
        </span>
        <input type="date" value="${item.date}" data-date="${item.id}"
               aria-label="Date for ${esc(name)}">
        <button class="snow" type="button" data-freeze="${item.id}"
                ${item.frozen ? 'data-on="1"' : ''} ${freezable || item.frozen ? '' : 'disabled'}
                title="${esc(tip)}" aria-label="${item.frozen ? 'Thaw' : 'Freeze'} ${esc(name)}">&#10052;</button>
        <button class="bin" type="button" data-remove="${item.id}"
                aria-label="Remove ${esc(name)}">&times;</button>
      </div>`
  }).join('')}</div>`

  host.querySelectorAll('[data-date]').forEach(input =>
    input.addEventListener('change', () => state.setDate(Number(input.dataset.date), input.value)))

  host.querySelectorAll('[data-freeze]').forEach(button =>
    button.addEventListener('click', () => {
      const id = Number(button.dataset.freeze)
      const item = state.fridge.find(i => i.id === id)
      if (item?.frozen) state.thaw(id); else state.freeze(id)
    }))

  host.querySelectorAll('[data-remove]').forEach(button =>
    button.addEventListener('click', () => state.removeItem(Number(button.dataset.remove))))
}
