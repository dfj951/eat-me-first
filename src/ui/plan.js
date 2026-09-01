/**
 * The week: tonight's meal in full, the next six days beneath it, and
 * the two things worth interrupting for — what's about to be wasted, and
 * what you'd have to buy.
 */

import { labelOf, canFreeze, freezeLife } from '../data/foods.js'
import { planWeek } from '../lib/planner.js'
import { daysText, shortDate, inDays, DAY_NAMES } from '../lib/dates.js'
import * as state from '../state.js'
import { escapeHtml as esc, list } from './html.js'

const EMPTY = `
  <div class="blank">
    <h3>Your fridge is empty</h3>
    <p>Add a few things on the left. Everything is scored by how soon it dies,
       so the meal at the top of the week is always the one that rescues the most food.</p>
  </div>`

const lower = keys => keys.map(labelOf).join(', ').toLowerCase()

export function renderPlan () {
  const out = document.getElementById('out')

  if (!state.fridge.length) {
    out.innerHTML = EMPTY
    return
  }

  const { days, wasted, toBuy } = planWeek(state.fridge, state.myMeals)
  const tonight = days[0]
  const now = new Date()

  /* ── tonight ─────────────────────────────────────────────────────── */

  const head = tonight.meal
    ? `
      <div class="tonight">
        <p class="eyebrow">Cook tonight</p>
        <h3>${esc(tonight.meal.name)}</h3>
        <p class="why">${esc(tonight.meal.note)}</p>
        <div class="meta">
          <span class="tag">${tonight.meal.mins} min</span>
          ${tonight.saves.length ? `<span class="tag save">Saves ${esc(lower(tonight.saves))}</span>` : ''}
          ${tonight.defrost.length ? '<span class="tag cold">From the freezer</span>' : ''}
          ${tonight.missing.length ? `<span class="tag">Buy ${esc(lower(tonight.missing))}</span>` : ''}
        </div>
        <p class="made">Made with ${esc(lower(tonight.uses))}.</p>
      </div>`
    : `
      <div class="tonight">
        <p class="eyebrow">Cook tonight</p>
        <h3>Not much to work with</h3>
        <p class="why">There isn’t enough in the fridge to build a meal around.
           Add a few more things, or treat tonight as a shopping night.</p>
      </div>`

  /* ── what's about to be lost, and how to save it ─────────────────── */

  const risk = wasted.length
    ? `<div class="notice risk">
        <h5>Won’t get eaten in time</h5>
        <ul>${wasted.map(item => {
          const source = state.fridge.find(f => f.id === item.id)
          const name = source ? state.nameOf(source) : labelOf(item.key)
          const why = source && state.isUnknown(source)
            ? 'it isn’t in the food list, so that one’s down to you'
            : 'nothing this week uses it'
          const fix = canFreeze(item.key)
            ? `. Frozen today it keeps until ${shortDate(inDays(freezeLife(item.key)))}
               <button class="freezebtn" type="button" data-freeze="${item.id}">Freeze it</button>`
            : '. It doesn’t freeze well either, so eat it or lose it'
          return `<li><b>${esc(name)}</b> — ${esc(daysText(item.expiresIn))}, and ${why}${fix}</li>`
        }).join('')}</ul>
      </div>`
    : ''

  /* ── things added by hand that no meal can use ───────────────────── */

  const unknown = state.fridge.filter(item =>
    state.isUnknown(item) && !wasted.some(w => w.id === item.id))

  const unknownNote = unknown.length
    ? `<div class="notice">
        <h5>Tracked, but not cooked with</h5>
        <p>${unknown.map(i => `<b>${esc(state.nameOf(i))}</b>`).join(', ')}
           ${unknown.length === 1 ? 'was' : 'were'} added by hand, so no meal gets built
           around ${unknown.length === 1 ? 'it' : 'them'} — the dates are watched, and that’s all.</p>
      </div>`
    : ''

  const shop = toBuy.length
    ? `<div class="notice">
        <h5>To make the week work, pick up</h5>
        <div class="shop">${toBuy.map(k => `<span>${esc(labelOf(k))}</span>`).join('')}</div>
      </div>`
    : ''

  /* ── the rest of the week ────────────────────────────────────────── */

  const week = `<div class="week">${days.slice(1).map(entry => {
    const date = new Date(now.getTime() + entry.day * 86400000)
    const when = `
      <div class="when">
        <b>${DAY_NAMES[date.getDay()].slice(0, 3)}</b>
        <small>${date.getDate()}/${date.getMonth() + 1}</small>
      </div>`

    if (!entry.meal) {
      return `<div class="day idle">${when}
        <div class="what">
          <h4>Nothing left worth planning</h4>
          <p>By here the fridge is empty — this is your shop.</p>
        </div></div>`
    }

    return `<div class="day">${when}
      <div class="what">
        <h4>${esc(entry.meal.name)}</h4>
        <p>${entry.saves.length ? `<span class="uses">Uses up ${esc(lower(entry.saves))}</span> &middot; ` : ''}${entry.meal.mins} min${
          entry.missing.length ? ` &middot; buy ${esc(lower(entry.missing))}` : ''}</p>
        <p class="made">${esc(lower(entry.uses))}</p>
        ${entry.defrost.length
          ? `<p class="defrost">Take the ${esc(list(entry.defrost.map(labelOf)).toLowerCase())} out the night before</p>`
          : ''}
      </div></div>`
  }).join('')}</div>`

  out.innerHTML = head + risk + unknownNote + shop + week

  out.querySelectorAll('[data-freeze]').forEach(button =>
    button.addEventListener('click', () => state.freeze(Number(button.dataset.freeze))))
}
