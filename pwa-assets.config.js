import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// The skyline safe-zone is baked into the SOURCE (public/icon.svg): the gradient
// background is full-bleed while the Valencia skyline is inset ~10% so it survives
// Android's round-mask crop. We therefore generate every icon with `padding: 0`
// so the gradient always fills the whole icon edge-to-edge — no white float on iOS,
// no transparent margin on Android.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Full-bleed maskable: gradient fills 100%, skyline already inside the safe zone.
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    // Full-bleed apple-touch icon: iOS rounds the corners itself (no white background).
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
})
