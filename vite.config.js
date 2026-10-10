import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        IconsResolver({
          prefix: 'icon',
        }),
      ],
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      pwaAssets: {
        disabled: true,
        config: true,
      },
      manifest: {
        id: '/',
        name: 'SUNspot',
        short_name: 'SUNspot',
        description: 'Encuentra la luz',
        start_url: '/',
        scope: '/',
        theme_color: '#e07820',
        background_color: '#fff9e6',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'es',
        dir: 'ltr',
        // Lets navigator.getInstalledRelatedApps() on Chrome Android tell that
        // the PWA is already installed when /descargar is opened in the browser.
        // Resolved against the manifest's own URL, so no hardcoded domain.
        related_applications: [{ platform: 'webapp', url: '/manifest.webmanifest' }],
        icons: [
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Precache the app shell only. Heavy images (avatars, ambassador photos)
        // are NOT precached — they're cached on demand at runtime instead, so
        // users only ever store the handful of images they actually view.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        globIgnores: ['**/avatars/**', '**/ambassadors/**'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Jawg map tiles / style / glyphs (used in Map.vue + PersonalMap.vue)
            urlPattern: /^https:\/\/api\.jawg\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jawg-map-tiles',
              expiration: {
                // Bounded to keep the footprint small. Panning is limited to a
                // 20km box around Valencia, so this comfortably covers the area.
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
                purgeOnQuotaError: true, // let the browser reclaim this first under storage pressure
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Local avatars + ambassador photos: cache only the ones actually shown
            urlPattern: /\/(avatars|ambassadors)\/.*\.(png|jpg|jpeg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cloudinary spot images (see utils/image.js). The transformation URL
            // is content-addressed, so CacheFirst is safe. Bounded to stay light.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-spot-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Split the heavy dependencies out of the app chunk.
        //
        // vue/leaflet/maplibre are statically imported, so splitting them does
        // NOT shorten the pre-mount critical path — the whole static graph has
        // to execute before the app mounts. What it buys there: a code-only
        // deploy re-downloads ~25KB of app chunk instead of invalidating the
        // vendor code too (the service worker keeps precached chunks whose
        // hashes didn't change), and chunks compile as they stream.
        //
        // firebase-sdk is different: nothing in the entry graph imports it
        // statically any more (see firebaseLazy.js), so it is fetched on demand
        // and is genuinely off the critical path.
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // maplibre-gl is the single heaviest dependency; the leaflet bridge
          // plugin (@maplibre/maplibre-gl-leaflet) belongs alongside it.
          if (id.includes('maplibre-gl')) return 'maplibre'
          if (id.includes('/leaflet/')) return 'leaflet'
          // 'firebase-sdk', not 'firebase': src/firebase.js is its own chunk
          // (it's only reachable dynamically now) and would collide by name.
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase-sdk'
          if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('/vue-router/')) return 'vue'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})