import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { showConfirmDialog } from 'vant'
import { releasesApi } from './api'
import { openExternal } from './native'

// Yangi versiya haqida ma'lumot (Menyu'da "Yangilash" tugmasi ham shundan)
export const availableUpdate = ref(null)
let checked = false

/** Joriy ilova versiyasi: { version: '1.0.0', build: 1 } */
export async function currentVersion() {
  try {
    const info = await App.getInfo()
    return { version: info.version, build: Number(info.build) || 0 }
  } catch {
    return { version: __APP_VERSION__, build: 0 }
  }
}

/**
 * Android: serverdagi eng yangi APK'ni tekshiradi; yangisi bo'lsa — taklif qiladi.
 * iOS yangilanishlari App Store/TestFlight orqali, shuning uchun bu yerda tekshirilmaydi.
 */
export async function checkForUpdate(t, { force = false } = {}) {
  if (Capacitor.getPlatform() !== 'android') return null
  if (checked && !force) return availableUpdate.value
  checked = true
  try {
    const [latest, current] = await Promise.all([releasesApi.latest('android'), currentVersion()])
    if (!latest?.url || Number(latest.version_code) <= current.build) {
      availableUpdate.value = null
      return null
    }
    availableUpdate.value = latest
    if (!force) promptUpdate(t)
    return latest
  } catch {
    return null
  }
}

export async function promptUpdate(t) {
  const u = availableUpdate.value
  if (!u) return
  try {
    await showConfirmDialog({
      title: t('m.updateTitle', { v: u.version_name }),
      message: [u.notes, t('m.updateHint')].filter(Boolean).join('\n\n'),
      messageAlign: 'left',
      confirmButtonText: t('m.updateNow'),
      cancelButtonText: t('m.later'),
    })
    // Brauzer APK'ni yuklaydi, so'ng o'rnatish oynasi ochiladi
    openExternal(u.url)
  } catch {
    /* keyinroq */
  }
}
