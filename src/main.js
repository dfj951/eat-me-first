/**
 * The entry point. Vite loads this from index.html, and it wires the
 * three panels to the state: when anything changes, everything redraws.
 *
 * Redrawing the lot on every change is not the fastest thing you could
 * do, but for a fridge with a few dozen items it's instant, and it means
 * there is never a stale corner of the screen. Optimise later, if ever.
 */

import './style.css'
import { onChange } from './state.js'
import { mountFridge, renderFridge, renderChips } from './ui/fridge.js'
import { mountMyMeals, renderMyMeals } from './ui/mymeals.js'
import { renderPlan } from './ui/plan.js'
import { renderDisliked } from './ui/disliked.js'

function renderAll () {
  renderChips()
  renderFridge()
  renderMyMeals()
  renderDisliked()
  renderPlan()
}

// Which build this is, so a cached copy on a phone is obvious.
const stamp = document.getElementById('build')
if (stamp) stamp.textContent = `Version ${__BUILT__}.`

/*
 * Keeping the app up to date.
 *
 * The service worker is what lets this run with no signal, but it will
 * happily serve yesterday's app for a load or two before noticing there
 * is a new one — and a phone that keeps the app suspended may not notice
 * for days. So: check for a new version every time the app comes back to
 * the front, and reload the moment one takes over.
 */
if ('serviceWorker' in navigator) {
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return // a controllerchange can fire twice; reload once
    reloading = true
    location.reload()
  })

  const checkForUpdate = () =>
    navigator.serviceWorker.getRegistration()
      .then(reg => reg?.update())
      .catch(() => { /* offline, or no registration yet. Try again later. */ })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate()
  })

  checkForUpdate()
}

// Wire up the bits that only need doing once.
mountFridge()
mountMyMeals()

// Then redraw on every change, and once now to start.
onChange(renderAll)
renderAll()
