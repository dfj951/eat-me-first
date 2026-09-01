import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base` matters for GitHub Pages: the site is served from
// /eat-me-first/ rather than the root, so asset URLs need the prefix.
export default defineConfig({
  base: '/eat-me-first/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Precache everything we build, so the app opens with no signal.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] },
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
