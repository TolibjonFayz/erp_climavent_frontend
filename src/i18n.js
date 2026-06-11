import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

const messages = {
  uz,
  ru,
}

const SUPPORTED_LOCALES = Object.keys(messages)

// Cookie'dan tilni o'qish
function getCookieLanguage(name = 'lang') {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      const lang = decodeURIComponent(cookie.substring(nameEQ.length))
      // Cookie'da boshqa loyihadan qolgan yaroqsiz til bo'lishi mumkin (masalan "en")
      return SUPPORTED_LOCALES.includes(lang) ? lang : 'uz'
    }
  }
  return 'uz'
}

const i18n = createI18n({
  locale: getCookieLanguage(),
  fallbackLocale: 'uz',
  globalInjection: true,
  messages,
})

export default i18n
