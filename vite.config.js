import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this from /eat-me-first/ rather than the root, so
// every asset URL needs that prefix. Change to '/' if it ever moves to a
// host that serves from the root.
// Stamped into the build so the footer can say which version is running.
// Saves guessing whether a phone is showing a cached copy.
const BUILT = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  define: { __BUILT__: JSON.stringify(BUILT) },

  // The barcode library can ship its WASM either as a separate file or
  // baked into the JavaScript. Baked in is what we want: one less thing
  // to fetch, and scanning keeps working with no signal.
  resolve: {
    conditions: ['zbar-inlined', 'module', 'browser', 'development|production']
  },

  base: '/eat-me-first/',
  // Vite assumes a very modern browser by default and leaves syntax like
  // ??= untouched, which older iPhones reject outright — the page just goes
  // blank. This converts it down so Safari 13 and up can run the app.
  build: { target: ['es2019', 'safari13'] },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Precache everything we build, so the app opens with no signal.
      // wasm included: the barcode scanner must work in a shop with no signal
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      },
      manifest: {
        name: 'Eat Me First',
        short_name: 'Eat Me First',
        description: 'Cook what dies first.',
        theme_color: '#111820',
        background_color: '#E9EEF2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
