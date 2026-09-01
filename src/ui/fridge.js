/**
 * The fridge panel: searching for food, the quick-add chips, and the
 * list itself sorted by what dies first.
 */

import { FOODS, canFreeze } from '../data/foods.js'
import { searchFoods } from '../lib/search.js'
import { startScanning, canScan } from '../lib/scanner.js'
import { daysLeft, daysText, urgency, shortDate } from '../lib/dates.js'
import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

/* The chips are only ever your own recent additions — there is no list
   of suggestions to wade through. Until you have added something the
   whole row stays hidden rather than showing my guess at what you buy. */
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

/* Nothing goes into the fridge until the date is confirmed. Picking a
   food opens this panel with a sensible date already filled in, so it
   stays quick — but you have looked at it, which is the point. */
let pending = null

const openAdd = food => { pending = { mode: 'add', food }; renderFridge() }
const openNew = name => { pending = { mode: 'new', name }; renderFridge() }
const openEdit = id => {
  const item = state.fridge.find(i => i.id === id)
  pending = { mode: 'edit', id, noDate: !!item?.noDate, openEnded: !!item?.openEnded }
  renderFridge()
}
const closePanel = () => { pending = null; renderFridge() }

/* A barcode we've just read but don't yet know the food for. Whatever
   gets added next is what this packet is, and we remember it. */
let awaitingCode = null

/* The prompt lives right under the search box, because that is where the
   answer has to be typed. It used to sit at the bottom of the panel next
   to the backup buttons, where nobody would ever see it. */
function showScanPrompt (on) {
  const prompt = document.getElementById('scanPrompt')
  const find = document.getElementById('find')
  if (prompt) prompt.hidden = !on
  if (find) {
    find.placeholder = on
      ? 'What was that? Yoghurt, bacon…'
      : 'Chicken, spinach, half a lemon…'
    if (on) find.focus()
  }
}

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

    // "milk, eggs, bread" in one go, on the sensible dates. Confirming a
    // date for each of twelve things would defeat the point.
    const several = typed.split(',').map(t => t.trim()).filter(Boolean)
    if (several.length > 1) {
      rows.push(`
        <button class="hit bulk" type="button" data-bulk="1">
          <b>Add all ${several.length}</b>
          <span>${esc(several.join(', '))}</span>
        </button>`)
    }

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
    const typed = search.value.trim()
    if (index === matches.length || !matches.length) openNew(typed)
    else openAdd(matches[index])
    search.value = ''
    close()
  }

  function addSeveral () {
    for (const term of search.value.split(',').map(t => t.trim()).filter(Boolean)) {
      const found = searchFoods(term, 1)[0]
      if (found) state.addFood(found.key)
      else state.addUnknown(term)
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
    if (button.dataset.bulk) return addSeveral()
    pick(button.dataset.own ? matches.length : Number(button.dataset.i))
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.finder')) close()
  })

  document.getElementById('chips').addEventListener('click', e => {
    const forget = e.target.closest('[data-forget]')
    if (forget) return state.forgetRecent(forget.dataset.forget)

    const add = e.target.closest('[data-k]')
    if (add) openAdd(FOODS[add.dataset.k])
  })

  /* ── the scanner ─────────────────────────────────────────────────── */

  const scanButton = document.getElementById('scan')
  const viewfinder = document.getElementById('viewfinder')
  const video = document.getElementById('scanVideo')
  const scanNote = document.getElementById('scanNote')
  let stopScanning = null

  // no camera, or an insecure connection: don't offer it at all
  scanButton.hidden = !canScan()

  const closeScanner = () => {
    stopScanning?.()
    stopScanning = null
    viewfinder.hidden = true
    scanButton.hidden = !canScan()
  }

  scanButton.addEventListener('click', async () => {
    scanButton.hidden = true
    viewfinder.hidden = false
    scanNote.className = 'scan-note'
    scanNote.textContent = 'Point the camera at the barcode.'

    stopScanning = await startScanning(video, code => {
      closeScanner()
      const known = state.foodForBarcode(code)

      if (known && FOODS[known]) {
        // seen this packet before, so straight to the usual panel
        awaitingCode = null
        openAdd(FOODS[known])
      } else {
        // a new packet: whatever you add next is what this is
        awaitingCode = code
        showScanPrompt(true)
      }
    }, message => {
      scanNote.className = 'scan-note bad'
      scanNote.textContent = message
    })
  })

  document.getElementById('scanStop').addEventListener('click', closeScanner)

  document.getElementById('scanForget').addEventListener('click', () => {
    awaitingCode = null
    showScanPrompt(false)
  })

  document.getElementById('empty')
    .addEventListener('click', () => state.emptyFridge())

  /* There is no server and no sync, so this file is the only copy of
     your fridge that isn't inside one browser. */
  const noteEl = document.getElementById('toolsNote')
  const note = text => { noteEl.textContent = text }

  document.getElementById('backup').addEventListener('click', () => {
    const data = JSON.stringify(state.exportAll(), null, 2)
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `eat-me-first-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    note('')
  })

  const fileInput = document.getElementById('restoreFile')
  document.getElementById('restore').addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    try {
      const ok = state.importAll(JSON.parse(await file.text()))
      note(ok ? '' : 'That file isn’t an Eat Me First backup.')
    } catch {
      note('Couldn’t read that file.')
    }
    fileInput.value = ''
  })
}

/** One tap for whatever you keep buying. Hidden until there is something in it. */
export function renderChips () {
  const block = document.getElementById('chipsBlock')
  const keys = state.recent.filter(key => FOODS[key]).slice(0, CHIP_COUNT)

  block.hidden = keys.length === 0
  if (!keys.length) {
    document.getElementById('chips').innerHTML = ''
    return
  }

  document.getElementById('chips').innerHTML = keys.map(key => {
    const label = esc(FOODS[key].label)
    return `<span class="chip">
      <button class="chip-add" type="button" data-k="${key}">${label}</button>
      <button class="chip-x" type="button" data-forget="${key}"
              aria-label="Remove ${label} from your usuals">&times;</button>
    </span>`
  }).join('')
}

function roleMenu (selected) {
  return `<select class="control" id="panelRole">
    ${ROLE_CHOICES.map(([value, text]) => `
      <option value="${value}" ${(selected ?? '') === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}
  </select>`
}

/**
 * The add / edit panel.
 *
 * Two things can be waved away rather than filled in: the date, for
 * anything that keeps far longer than you'll take to eat it, and the
 * amount, for a bottle of oil or a jar of paste where counting meals is
 * meaningless. Both are toggles, so you can skip either or both, and the
 * choice sticks when you save.
 */
function renderPanel () {
  const host = document.getElementById('pendingHost')
  if (!pending) { host.innerHTML = ''; return }

  const item = pending.mode === 'edit'
    ? state.fridge.find(i => i.id === pending.id)
    : null
  if (pending.mode === 'edit' && !item) { pending = null; host.innerHTML = ''; return }

  const own = pending.mode === 'new' || (item && state.isUnknown(item))
  const name = pending.mode === 'add' ? pending.food.label
    : pending.mode === 'new' ? pending.name
      : state.nameOf(item)
  const date = item ? item.date
    : pending.mode === 'add' ? state.suggestedDate(pending.food.key) : state.suggestedDate('')
  const uses = item ? state.usesOf(item)
    : pending.mode === 'add' ? pending.food.uses : 1

  host.innerHTML = `
    <div class="panel-form">
      <p class="eyebrow">${pending.mode === 'edit' ? 'Edit' : 'Adding'}</p>

      ${own
        ? `<div class="field">
             <label for="panelName">Name</label>
             <input class="control" id="panelName" value="${esc(name)}">
           </div>`
        : `<p class="panel-name">${esc(name)}</p>`}

      ${pending.noDate
        ? '<p class="hint">No date — it just sits there until you use it.</p>'
        : `<div class="field">
             <label for="panelDate">When does it go off?</label>
             <input class="control" id="panelDate" type="date" value="${date}">
           </div>`}

      ${pending.openEnded
        ? '<p class="hint">No amount — it stays in the list until you remove it.</p>'
        : `<div class="field">
             <label for="panelUses">How many meals' worth?</label>
             <input class="control" id="panelUses" type="number" min="1" max="20"
                    inputmode="numeric" value="${uses}">
           </div>`}

      ${own
        ? `<div class="field"><label for="panelRole">What is it?</label>${roleMenu(item?.role ?? '')}</div>`
        : ''}

      <div class="panel-actions">
        <button class="btn" id="panelSave" type="button">${pending.mode === 'edit' ? 'Save' : 'Add to fridge'}</button>
        <button class="btn-ghost" id="panelCancel" type="button">Cancel</button>
      </div>

      <button class="linkish" id="panelNoDate" type="button">${
        pending.noDate ? 'Actually, give it a date' : 'No date — it keeps'
      }</button>
      <button class="linkish" id="panelOpen" type="button">${
        pending.openEnded ? 'Actually, count the meals' : 'No amount — I’ll remove it when it’s gone'
      }</button>
    </div>`

  const val = id => document.getElementById(id)?.value

  document.getElementById('panelCancel').addEventListener('click', closePanel)

  // the two shortcuts just flip a switch; nothing is saved until you press Add
  document.getElementById('panelNoDate').addEventListener('click', () => {
    pending = { ...pending, noDate: !pending.noDate }
    renderFridge()
  })
  document.getElementById('panelOpen').addEventListener('click', () => {
    pending = { ...pending, openEnded: !pending.openEnded }
    renderFridge()
  })

  document.getElementById('panelSave').addEventListener('click', () => {
    const role = val('panelRole') === 'none' ? null : val('panelRole') || null
    const opts = {
      date: pending.noDate ? null : val('panelDate'),
      noDate: !!pending.noDate,
      openEnded: !!pending.openEnded,
      uses: pending.openEnded ? undefined : Number(val('panelUses'))
    }

    // remember how long you gave it, so the next one starts nearer
    if (!pending.noDate && opts.date) {
      const key = pending.mode === 'add' ? pending.food.key : null
      if (key) state.noteDateChoice(key, daysLeft(opts.date))
    }

    if (pending.mode === 'add') {
      state.addFood(pending.food.key, opts)
      if (awaitingCode) {
        state.rememberBarcode(awaitingCode, pending.food.key)
        awaitingCode = null
        showScanPrompt(false)
      }
    } else if (pending.mode === 'new') {
      state.addUnknown(val('panelName'), { ...opts, role })
      if (awaitingCode) {
        state.rememberBarcode(awaitingCode, 'own:' + val('panelName').trim().toLowerCase())
        awaitingCode = null
        showScanPrompt(false)
      }
    } else {
      state.updateItem(pending.id, { ...opts, label: val('panelName'), role })
    }

    closePanel()
  })

  document.getElementById(own ? 'panelName' : 'panelSave')?.focus()
}

/** Redraw the list. Called by main.js whenever the state changes. */
export function renderFridge () {
  renderPanel()
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
              : item.noDate ? 'no date' : esc(daysText(days))}</small>
            ${state.isUnknown(item) ? `
              <select class="role" data-role="${item.id}"
                      aria-label="What kind of food is ${esc(name)}?">
                ${ROLE_CHOICES.map(([value, text]) => `
                  <option value="${value}" ${
                    (item.role ?? (item.roleSet ? 'none' : '')) === value ? 'selected' : ''
                  }>${esc(text)}</option>`).join('')}
              </select>` : ''}
            ${item.openEnded
              ? '<span class="unit">no amount</span>'
              : `<span class="qty" title="Roughly how many meals this will stretch to">
                   <button type="button" data-less="${item.id}" aria-label="Less ${esc(name)}"
                           ${uses <= 1 ? 'disabled' : ''}>&minus;</button>
                   <b>${uses}</b>
                   <button type="button" data-more="${item.id}" aria-label="More ${esc(name)}">+</button>
                   <span class="unit">meal${uses === 1 ? '' : 's'}</span>
                 </span>`}
          </div>
        </div>
        <button class="snow" type="button" data-edit="${item.id}"
                title="Edit ${esc(name)}" aria-label="Edit ${esc(name)}">&#9998;</button>
        <button class="snow" type="button" data-freeze="${item.id}"
                ${item.frozen ? 'data-on="1"' : ''} ${freezable || item.frozen ? '' : 'disabled'}
                title="${esc(tip)}" aria-label="${item.frozen ? 'Thaw' : 'Freeze'} ${esc(name)}">&#10052;</button>
        <button class="bin" type="button" data-remove="${item.id}"
                aria-label="Remove ${esc(name)}">&times;</button>
      </div>`
  }).join('')}</div>`

  host.querySelectorAll('[data-edit]').forEach(button =>
    button.addEventListener('click', () => openEdit(Number(button.dataset.edit))))

  host.querySelectorAll('[data-role]').forEach(select =>
    select.addEventListener('change', () =>
      state.setRole(Number(select.dataset.role), select.value === 'none' ? null : select.value)))

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
