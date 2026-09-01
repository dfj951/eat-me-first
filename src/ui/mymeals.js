/**
 * Your own meals.
 *
 * Everyone cooks about fifteen things on repeat. Once these are in they
 * beat anything the shapes can invent, because they're what you actually
 * make. Type the ingredients however you like — "kidney beans" finds the
 * tinned beans — and anything that can't be placed is named rather than
 * silently dropped.
 */

import { labelOf } from '../data/foods.js'
import { findFood } from '../lib/search.js'
import * as state from '../state.js'
import { escapeHtml as esc, list } from './html.js'

export function mountMyMeals () {
  const nameInput = document.getElementById('mealName')
  const ingInput = document.getElementById('mealIngredients')
  const error = document.getElementById('mealError')

  document.getElementById('mealAdd').addEventListener('click', () => {
    const name = nameInput.value.trim()
    const typed = ingInput.value.split(',').map(t => t.trim()).filter(Boolean)

    if (!name) {
      error.textContent = 'Give the meal a name.'
      nameInput.focus()
      return
    }
    if (!typed.length) {
      error.textContent = 'List what goes in it, separated by commas.'
      ingInput.focus()
      return
    }

    const keys = []
    const unplaced = []
    for (const term of typed) {
      const food = findFood(term)
      if (!food) unplaced.push(term)
      else if (!keys.includes(food.key)) keys.push(food.key)
    }

    if (!keys.length) {
      error.textContent = 'None of those match anything I know. Try plainer words — mince, rice, onion.'
      return
    }

    error.textContent = unplaced.length
      ? `Saved, but I couldn’t place ${list(unplaced)} — the rest is in.`
      : ''

    state.addMeal(name, keys)
    nameInput.value = ''
    ingInput.value = ''
  })
}

export function renderMyMeals () {
  const host = document.getElementById('mealsHost')

  if (!state.myMeals.length) {
    host.innerHTML = ''
    return
  }

  host.innerHTML = `<div class="mine">${state.myMeals.map(meal => `
    <div class="mymeal">
      <span>
        <b>${esc(meal.name)}</b>
        <small>${esc(meal.keys.map(labelOf).join(', ').toLowerCase())}</small>
      </span>
      <button class="bin" type="button" data-meal="${meal.id}"
              aria-label="Remove ${esc(meal.name)}">&times;</button>
    </div>`).join('')}</div>`

  host.querySelectorAll('[data-meal]').forEach(button =>
    button.addEventListener('click', () => state.removeMeal(Number(button.dataset.meal))))
}
