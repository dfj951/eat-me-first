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

// Wire up the bits that only need doing once.
mountFridge()
mountMyMeals()

// Then redraw on every change, and once now to start.
onChange(renderAll)
renderAll()
