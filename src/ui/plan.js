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

const lower = keys => keys.map(labelOf).join(', ').toLowerCase()

export function renderPlan () {
  const out = document.getElementById('out')

  if (!state.fridge.length) {
    out.innerHTML = EMPTY
    return
  }

  const { days, wasted } = planWeek(state.fridge, state.myMeals, state.disliked)
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

  /* ── the rest of the week ────────────────────────────────────────── */

  /* A blank day with cooking still to come is a gap in the middle of the
     week, not the end of the food: something is being saved for later.
     That's a night to get something in. */
  const lastCooking = days.reduce((last, d, i) => (d.meal ? i : last), -1)

  const dayLabel = date => `
      <div class="when">
        <b>${DAY_NAMES[date.getDay()].slice(0, 3)}</b>
        <small>${date.getDate()}/${date.getMonth() + 1}</small>
      </div>`

  const rows = []

  for (const entry of days.slice(1)) {
    // The empty run at the end of the week is summarised below rather
    // than repeated as four identical rows.
    if (!entry.meal && entry.day > lastCooking) break

    const when = dayLabel(new Date(now.getTime() + entry.day * 86400000))

    if (!entry.meal) {
      rows.push(`<div class="day idle">${when}
        <div class="what">
          <h4>Takeaway</h4>
          <p>Nothing here makes a meal today, and what’s left is wanted later
             in the week. A night to order in.</p>
        </div></div>`)
      continue
    }

    rows.push(`<div class="day">${when}
      <div class="what">
        <div class="day-head">
          <h4>${esc(entry.meal.name)}</h4>
          <button class="nope" type="button" data-nope="${esc(entry.meal.name)}">Not for me</button>
        </div>
        <p>${entry.saves.length ? `<span class="uses">Uses up ${esc(lower(entry.saves))}</span> &middot; ` : ''}${entry.meal.mins} min</p>
        <p class="made">${esc(lower(entry.uses))}</p>
        ${entry.defrost.length
          ? `<p class="defrost">Take the ${esc(list(entry.defrost.map(labelOf)).toLowerCase())} out the night before</p>`
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
        <h4>Time for a shop</h4>
        <p>The fridge runs out here. A shop, or something ordered in.</p>
      </div></div>`)
  }

  const week = `<div class="week">${rows.join('')}</div>`

  out.innerHTML = head + risk + unknownNote + week

  out.querySelectorAll('[data-freeze]').forEach(button =>
    button.addEventListener('click', () => state.freeze(Number(button.dataset.freeze))))

  out.querySelectorAll('[data-nope]').forEach(button =>
    button.addEventListener('click', () => state.dislike(button.dataset.nope)))
}
