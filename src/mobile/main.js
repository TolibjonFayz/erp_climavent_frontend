import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import Vant, { Locale } from 'vant'
import vantRu from 'vant/es/locale/lang/ru-RU'
import 'vant/lib/index.css'

import i18n from '@/i18n'
import { setUnauthorizedHandler } from '@/api/client'
import { useUsersStore } from '@/stores/user'
import { installMobileMessages, vantUz } from './i18n'
import App from './App.vue'
import router from './router'
import { initNative } from './native'
import './styles/app.css'

installMobileMessages(i18n)

// Vant komponentlari tili (o'zbekchasi Vant'da yo'q — o'zimiz beramiz)
Locale.add({ 'uz-UZ': vantUz })
const syncVantLocale = (lang) =>
  Locale.use(lang === 'ru' ? 'ru-RU' : 'uz-UZ', lang === 'ru' ? vantRu : vantUz)
// i18n legacy rejimda: global.locale — oddiy xususiyat (reaktiv getter)
watch(() => i18n.global.locale, syncVantLocale, { immediate: true })

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Vant)

// Sessiya tugasa (401 / bloklangan) — login ekraniga
setUnauthorizedHandler(() => {
  useUsersStore(pinia).currentUser = null
  if (router.currentRoute.value.name !== 'login') router.replace({ name: 'login' })
})

app.mount('#app')
initNative(router)
