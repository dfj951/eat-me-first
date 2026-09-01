/**
 * THE SHOPPING LIST
 *
 * Deliberately apart from the meal plan. The plan never tells you to go
 * buying — you were clear about that — but a list you sit down and write
 * is a different thing, and "shopping without a plan" was one of the
 * problems this app was meant to solve.
 *
 * Ticking something off puts it straight in the fridge on the usual
 * date, because in a shop you want one tap, not a form.
 */

import { labelOf } from '../data/foods.js'
import { findFood } from '../lib/search.js'
import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

export function mountShopping () {
  const input = document.getElementById('listInput')

  const add = () => {
    const text = input.value.trim()
    if (!text) return
    // several at once, same as adding to the fridge
    for (const term of text.split(',').map(t => t.trim()).filter(Boolean)) {
      const known = findFood(term)
      state.addToList(known ? known.label : term, known?.key ?? null)
    }
    input.value = ''
  }

  document.getElementById('listAdd').addEventListener('click', add)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  })

  document.getElementById('listClear').addEventListener('click', () => state.clearList())
}

export function renderShopping () {
  const host = document.getElementById('listBody')
  const count = document.getElementById('listCount')
  const items = state.shopping

  count.textContent = items.length ? `(${items.length})` : ''

  const low = state.runningLow()

  host.innerHTML = `
    ${items.length
      ? `<div class="mine">${items.map(entry => `
          <div class="mymeal">
            <span><b>${esc(entry.label)}</b>${
              entry.key ? '' : '<small>not in the food list</small>'}</span>
            <span class="list-actions">
              <button class="btn-ghost tiny" type="button" data-got="${entry.id}">Got it</button>
              <button class="bin" type="button" data-unlist="${entry.id}"
                      aria-label="Remove ${esc(entry.label)}">&times;</button>
            </span>
          </div>`).join('')}</div>`
      : '<p class="nothing">Nothing on the list.</p>'}

    ${low.length
      ? `<div>
          <p class="eyebrow" style="margin-top:12px">You usually have these</p>
          <div class="chips">${low.map(key => `
            <span class="chip">
              <button class="chip-add" type="button" data-low="${key}">${esc(labelOf(key))}</button>
            </span>`).join('')}</div>
        </div>`
      : ''}`

  host.querySelectorAll('[data-got]').forEach(button =>
    button.addEventListener('click', () => state.gotIt(Number(button.dataset.got))))

  host.querySelectorAll('[data-unlist]').forEach(button =>
    button.addEventListener('click', () => state.removeFromList(Number(button.dataset.unlist))))

  host.querySelectorAll('[data-low]').forEach(button =>
    button.addEventListener('click', () => state.addToList(labelOf(button.dataset.low), button.dataset.low)))
}
