/**
 * The meals you've turned down.
 *
 * Nothing is ever lost — anything dismissed shows up here with a way to
 * put it back. Without that, one stray tap would quietly delete a meal
 * from the app for good, and you'd have no idea why it stopped appearing.
 */

import * as state from '../state.js'
import { escapeHtml as esc } from './html.js'

export function renderDisliked () {
  const host = document.getElementById('dislikedHost')

  if (!state.disliked.length) {
    host.innerHTML = ''
    return
  }

  host.innerHTML = `
    <details class="turned-down">
      <summary>Turned down (${state.disliked.length})</summary>
      <div class="mine" style="margin-top:10px">
        ${state.disliked.map(name => `
          <div class="mymeal">
            <span><b>${esc(name)}</b><small>won’t be suggested</small></span>
            <button class="btn-ghost tiny" type="button" data-allow="${esc(name)}">Put back</button>
          </div>`).join('')}
      </div>
    </details>`

  host.querySelectorAll('[data-allow]').forEach(button =>
    button.addEventListener('click', () => state.allow(button.dataset.allow)))
}
