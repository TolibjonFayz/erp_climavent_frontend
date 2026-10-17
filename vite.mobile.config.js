import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Mobil ilova (Capacitor) uchun alohida build: kirish nuqtasi `mobile.html`,
// natija `dist-mobile/index.html` ga tushadi va Capacitor shu papkani ilovaga joylaydi.
// API, store va utillar saytniki bilan umumiy (`src/`), mobil ekranlar `src/mobile/` da.

// Capacitor webDir ichida `index.html` kutadi
const renameEntry = {
  name: 'mobile-entry-as-index',
  enforce: 'post',
  generateBundle(_, bundle) {
    const html = bundle['mobile.html']
    if (html) {
      html.fileName = 'index.html'
    }
  },
}

// Dev serverda bosh sahifa ham mobil ilovani ochsin (index.html — sayt)
const devEntry = {
  name: 'mobile-dev-entry',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/' || req.url.startsWith('/?')) req.url = '/mobile.html'
      next()
    })
  },
}

// Ilova versiyasi (Android versionName / iOS CFBundleShortVersionString bilan bir xil tuting)
export const MOBILE_VERSION = '1.0.0'

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(MOBILE_VERSION),
  },
  plugins: [vue(), renameEntry, devEntry],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Dev: bog'liqliklar oldindan yig'iladi (aks holda yangi sahifa ochilganda Vite butun ilovani qayta yuklaydi)
  optimizeDeps: {
    entries: ['mobile.html', 'src/mobile/**/*.vue'],
    include: ['mapbox-gl'],
  },
  server: {
    port: 5185,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: 'dist-mobile',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: fileURLToPath(new URL('./mobile.html', import.meta.url)),
    },
  },
})
