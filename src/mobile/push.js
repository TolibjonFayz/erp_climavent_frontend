import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { App } from '@capacitor/app'
import { showNotify } from 'vant'
import { devicesApi } from './api'

// Android: Firebase sozlamasi (google-services.json) bilan yig'ilgan build'dagina —
// usiz register() Firebase xatosi bilan yiqiladi. iOS: APNs to'g'ridan-to'g'ri, fayl kerak emas.
export const pushEnabled =
  Capacitor.getPlatform() === 'ios' || (Capacitor.getPlatform() === 'android' && __PUSH_ENABLED__)

const TOKEN_KEY = 'pushToken'
let listenersReady = false
let routerRef = null

async function sendToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
  let appVersion = ''
  try {
    const info = await App.getInfo()
    appVersion = `${info.version} (${info.build})`
  } catch {
    /* web */
  }
  await devicesApi
    .register({
      token,
      platform: Capacitor.getPlatform(),
      lang: localStorage.getItem('lang') === 'ru' ? 'ru' : 'uz',
      app_version: appVersion,
    })
    .catch(() => {})
}

function addListeners() {
  if (listenersReady) return
  listenersReady = true
  PushNotifications.addListener('registration', (t) => sendToken(t.value))
  // Ilova ochiq turganda Android o'zi bildirishnoma chiqarmaydi — banner ko'rsatamiz
  PushNotifications.addListener('pushNotificationReceived', (n) => {
    const route = n?.data?.route
    const text = [n?.title, n?.body].filter(Boolean).join(' — ')
    showNotify({
      type: 'primary',
      message: text,
      duration: 5000,
      onClick: () => route && routerRef && routerRef.push(route).catch(() => {}),
    })
  })
  // Bildirishnoma bosilganda — tegishli sahifani ochamiz
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const route = action?.notification?.data?.route
    if (route && routerRef) routerRef.push(route).catch(() => {})
  })
}

/** Kirgandan keyin: ruxsat so'rash va tokenni serverga yuborish */
export async function initPush(router) {
  routerRef = router
  if (!pushEnabled) return
  try {
    addListeners()
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') return
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'erp',
        name: 'Climavent ERP',
        description: 'Vazifalar, tasdiqlar va e\'lonlar',
        importance: 4,
        visibility: 1,
        vibration: true,
      }).catch(() => {})
    }
    await PushNotifications.register()
  } catch {
    /* bildirishnoma ishlamasa ham ilova ishlayveradi */
  }
}

/** Hisobdan chiqishda — bu qurilmaga boshqa xabar kelmasin */
export async function stopPush() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!pushEnabled || !token) return
  await devicesApi.unregister(token).catch(() => {})
  localStorage.removeItem(TOKEN_KEY)
}

/** Til o'zgarsa — server keyingi xabarlarni shu tilda yuborsin */
export async function refreshPushLang() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (pushEnabled && token) await sendToken(token)
}
