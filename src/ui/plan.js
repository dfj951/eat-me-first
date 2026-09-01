/**
 * The week: tonight's meal in full, the next six days beneath it, and the
 * one thing worth interrupting for — what's about to be wasted.
 *
 * Nothing here ever tells you to go shopping. Every meal shown is one you
 * can cook right now with what you already have.
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

const lower = keys => keys.map(state.labelForKey).join(', ').toLowerCase()

export function renderPlan () {
  const out = document.getElementById('out')

  if (!state.fridge.length) {
    out.innerHTML = EMPTY
    return
  }

  const { days, wasted } = planWeek(state.fridge, state.myMeals, state.disliked,
    { avoided: state.avoided, maxMins: state.maxMins })

  /* Undo sits at the top of the plan, right where the tap happened.
     It stays put until it's used or waved away — a strip that vanishes on
     a timer is no use to someone who has just looked up from the hob. */
  const { meals, rescued } = state.tally()
  const tally = meals
    ? `<p class="tally">${meals} meal${meals === 1 ? '' : 's'} cooked${
        rescued ? ` &middot; <b>${rescued}</b> thing${rescued === 1 ? '' : 's'} rescued` : ''}</p>`
    : ''

  /* How long you've got tonight. A shape that takes longer simply isn't
     offered, which is more use than a list you have to read past. */
  const TIMES = [[null, 'Any'], [15, '15 min'], [30, '30'], [45, '45']]
  const timer = `<div class="times">${TIMES.map(([mins, label]) =>
    `<button type="button" class="time${state.maxMins === mins ? ' on' : ''}"
             data-mins="${mins ?? ''}">${label}</button>`).join('')}</div>`

  const undo = state.lastDismissed
    ? `<div class="undo">
        <span>Turned down <b>${esc(state.lastDismissed)}</b>. It won’t be suggested again.</span>
        <button class="btn-ghost tiny" type="button" data-undo="${esc(state.lastDismissed)}">Undo</button>
        <button class="bin" type="button" data-undo-close="1" aria-label="Dismiss">&times;</button>
      </div>`
    : ''
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
          ${tonight.fromFreezer.length ? '<span class="tag cold">From the freezer</span>' : ''}
          <button class="nope" type="button" data-nope="${esc(tonight.meal.name)}">Not for me</button>
        </div>
        <p class="made">Made with ${esc(lower(tonight.uses))}.</p>
        <button class="btn cooked" type="button" id="cookedIt">I cooked this</button>
      </div>`
    : state.maxMins
      ? `
      <div class="tonight">
        <p class="eyebrow">Cook tonight</p>
        <h3>Nothing that quick</h3>
        <p class="why">Nothing in your fridge makes a meal in under ${state.maxMins} minutes.
           Give it longer above, or add a few more things.</p>
      </div>`
      : `
      <div class="tonight">
        <p class="eyebrow">Cook tonight</p>
        <h3>Nothing to build on yet</h3>
        <p class="why">There isn’t enough in the fridge to make a whole meal from.
           Add a few more things — including the pasta, rice and tins in your cupboard,
           since it only ever suggests what you already have.</p>
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

  // only the ones still waiting to be told what they are
  const unknown = state.fridge.filter(item =>
    state.isUnknown(item) && !item.role && !wasted.some(w => w.id === item.id))

  const unknownNote = unknown.length
    ? `<div class="notice">
        <h5>Tracked, but not cooked with</h5>
        <p>${unknown.map(i => `<b>${esc(state.nameOf(i))}</b>`).join(', ')}
           ${unknown.length === 1 ? 'needs' : 'need'} saying what
           ${unknown.length === 1 ? 'it is' : 'they are'} before a meal can use
           ${unknown.length === 1 ? 'it' : 'them'} — there’s a menu on
           ${unknown.length === 1 ? 'its' : 'their'} row in the fridge.</p>
      </div>`
    : ''

  /* ── the rest of the week ────────────────────────────────────────── */

  /* The week runs until the food does. The first day with nothing to
     cook ends the list — no gaps in the middle, because there is still
     food to get through and a takeaway suggested then would be the app
     second-guessing you. */
  const lastCooking = days.reduce((last, d, i) => (d.meal ? i : last), -1)

  const dayLabel = date => `
      <div class="when">
        <b>${DAY_NAMES[date.getDay()].slice(0, 3)}</b>
        <small>${date.getDate()}/${date.getMonth() + 1}</small>
      </div>`

  const rows = []

  for (const entry of days.slice(1)) {
    // Everything after the food runs out is summarised in one row below.
    if (!entry.meal) break

    const when = dayLabel(new Date(now.getTime() + entry.day * 86400000))

    rows.push(`<div class="day">${when}
      <div class="what">
        <div class="day-head">
          <h4>${esc(entry.meal.name)}</h4>
          <button class="nope" type="button" data-nope="${esc(entry.meal.name)}">Not for me</button>
        </div>
        <p>${entry.saves.length ? `<span class="uses">Uses up ${esc(lower(entry.saves))}</span> &middot; ` : ''}${entry.meal.mins} min</p>
        <p class="made">${esc(lower(entry.uses))}</p>
        ${entry.defrost.length
          ? `<p class="defrost">Take the ${esc(list(entry.defrost.map(state.labelForKey)).toLowerCase())} out the night before</p>`
          : ''}
      </div></div>`)
  }

  // Once the food runs out, say so once and say what to do about it.
  if (lastCooking < 6) {
    const from = new Date(now.getTime() + Math.max(1, lastCooking + 1) * 86400000)
    rows.push(`<div class="day idle">
      <div class="when">
        <b>${DAY_NAMES[from.getDay()].slice(0, 3)}</b>
        <small>onwards</small>
      </div>
      <div class="what">
        <h4>Time for a shop — or a takeaway</h4>
        <p>The food runs out here. Nothing left to build a meal from.</p>
      </div></div>`)
  }

  const week = `<div class="week">${rows.join('')}</div>`

  out.innerHTML = undo + tally + timer + head + risk + unknownNote + week

  out.querySelectorAll('[data-freeze]').forEach(button =>
    button.addEventListener('click', () => state.freeze(Number(button.dataset.freeze))))

  // Closing over tonight rather than stashing ids in the markup
  document.getElementById('cookedIt')?.addEventListener('click', () =>
    state.cookMeal(tonight.meal.name, tonight.usedIds, tonight.saves))

  out.querySelectorAll('[data-mins]').forEach(button =>
    button.addEventListener('click', () =>
      state.setMaxMins(button.dataset.mins ? Number(button.dataset.mins) : null)))

  out.querySelectorAll('[data-nope]').forEach(button =>
    button.addEventListener('click', () => state.dislike(button.dataset.nope)))

  out.querySelectorAll('[data-undo]').forEach(button =>
    button.addEventListener('click', () => state.allow(button.dataset.undo)))

  out.querySelectorAll('[data-undo-close]').forEach(button =>
    button.addEventListener('click', () => state.clearUndo()))
}
