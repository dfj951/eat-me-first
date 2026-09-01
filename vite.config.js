import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from the root on Vercel. If this ever moves to GitHub Pages,
// set base to '/eat-me-first/' so the asset URLs get the repo prefix.
export default defineConfig({
  base: '/',
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
