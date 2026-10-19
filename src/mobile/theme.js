import { watch } from 'vue'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { useTheme } from '@/composables/useTheme'

// Tungi rejim holati saytniki bilan umumiy (composables/useTheme.js: html.dark, localStorage 'erp-theme').
// Bu yerda faqat mobilga xos qismlari: Vant tungi o'zgaruvchilari, brauzer paneli rangi, tizim
// panellari (soat/batareya) belgilarining rangi.
const { isDark, toggleTheme } = useTheme()

const THEME_COLOR = { light: '#ffffff', dark: '#151d2e' }

export function syncSystemBars() {
  if (!Capacitor.isNativePlatform()) return
  SystemBars.setStyle({ style: isDark.value ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {})
}

function apply(dark) {
  document.documentElement.classList.toggle('van-theme-dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
  syncSystemBars()
}

export function initTheme() {
  watch(isDark, apply, { immediate: true })
}

export { isDark, toggleTheme }
