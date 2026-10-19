import { onBeforeUnmount, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Browser } from '@capacitor/browser'
import { syncSystemBars } from './theme'

export const isNative = Capacitor.isNativePlatform()

// ─── Ochiq oynalar (popup/sheet) — Android "orqaga" tugmasi avval ularni yopadi ───
const overlayStack = []

/** Popup ko'rinishini "orqaga" tugmasiga bog'laydi: ochiq bo'lsa, orqaga uni yopadi. */
export function useBackClose(visible) {
  const close = () => {
    visible.value = false
  }
  const remove = () => {
    const i = overlayStack.indexOf(close)
    if (i !== -1) overlayStack.splice(i, 1)
  }
  watch(visible, (open) => (open ? overlayStack.push(close) : remove()), { immediate: true })
  onBeforeUnmount(remove)
}

/** Komponentsiz oyna (masalan, rasm ko'ruvchi) uchun: yopish funksiyasini qo'shadi, olib tashlovchini qaytaradi */
export function pushOverlay(close) {
  overlayStack.push(close)
  return () => {
    const i = overlayStack.indexOf(close)
    if (i !== -1) overlayStack.splice(i, 1)
  }
}

export function initNative(router) {
  if (!isNative) return

  syncSystemBars()

  App.addListener('backButton', () => {
    const closeTop = overlayStack.pop()
    if (closeTop) {
      closeTop()
      return
    }
    const route = router.currentRoute.value
    if (route.meta.tab || route.name === 'login') {
      App.minimizeApp()
    } else if (window.history.state?.back) {
      router.back()
    } else {
      router.replace({ name: 'home' })
    }
  })

  router.isReady().then(() => {
    // Birinchi ekran chizilgach splash'ni yopamiz
    requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {}))
  })
}

/** Yengil tebranish (faqat telefonda) */
export function tapFeedback(style = ImpactStyle.Light) {
  if (isNative) Haptics.impact({ style }).catch(() => {})
}

/** Tashqi havolani ochish: ilovada — ichki brauzer, saytda — yangi oyna */
export function openExternal(url) {
  if (!url) return
  if (isNative) Browser.open({ url })
  else window.open(url, '_blank', 'noopener')
}

/** Xarita ilovasida ochish */
export function openMap(lat, lng, label = '') {
  if (!lat || !lng) return
  const q = encodeURIComponent(label)
  const url =
    Capacitor.getPlatform() === 'ios'
      ? `https://maps.apple.com/?ll=${lat},${lng}&q=${q || 'Obyekt'}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  if (isNative && Capacitor.getPlatform() === 'android') {
    window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${q})`
  } else {
    openExternal(url)
  }
}
