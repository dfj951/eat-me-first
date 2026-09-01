/**
 * FOOD YOU DON'T EAT
 *
 * Turning down whole meals one at a time works, but if you simply don't
 * eat mushrooms you'd be doing it forever. This is the other half: name
 * the ingredient once and nothing is ever built around it.
 *
 * The dietary buttons are shortcuts that fill the same list — a preset,
 * not a mode. Tap "Vegetarian" and you get every meat and fish in the
 * list, still individually removable afterwards.
 */

import { DIET_GROUPS, labelOf } from '../data/foods.js'
import { findFood } from '../lib/search.js'
import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

export function mountAvoid () {
  const input = document.getElementById('avoidInput')

  const add = () => {
    const text = input.value.trim()
    if (!text) return
    for (const term of text.split(',').map(t => t.trim()).filter(Boolean)) {
      const found = findFood(term)
      if (found) state.avoid(found.key)
    }
    input.value = ''
  }

  document.getElementById('avoidAdd').addEventListener('click', add)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  })

  const presets = document.getElementById('avoidPresets')
  presets.innerHTML = Object.keys(DIET_GROUPS).map(name =>
    `<span class="chip"><button class="chip-add" type="button"
       data-diet="${esc(name)}">${esc(name)}</button></span>`).join('')

  presets.addEventListener('click', e => {
    const button = e.target.closest('[data-diet]')
    if (button) state.avoidGroup(DIET_GROUPS[button.dataset.diet] ?? [])
  })
}

export function renderAvoid () {
  const host = document.getElementById('avoidBody')
  const count = document.getElementById('avoidCount')

  count.textContent = state.avoided.length ? `(${state.avoided.length})` : ''

  if (!state.avoided.length) {
    host.innerHTML = '<p class="nothing">Nothing ruled out.</p>'
    return
  }

  host.innerHTML = `<div class="chips">${state.avoided.map(key => `
    <span class="chip">
      <span class="chip-add">${esc(labelOf(key))}</span>
      <button class="chip-x" type="button" data-allow-food="${key}"
              aria-label="Allow ${esc(labelOf(key))} again">&times;</button>
    </span>`).join('')}</div>`

  host.querySelectorAll('[data-allow-food]').forEach(button =>
    button.addEventListener('click', () => state.unavoid(button.dataset.allowFood)))
}
