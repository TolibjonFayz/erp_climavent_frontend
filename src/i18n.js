import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

const messages = {
  uz,
  ru,
}

const SUPPORTED_LOCALES = Object.keys(messages)

function getCookieLanguage(name = 'lang') {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      const lang = decodeURIComponent(cookie.substring(nameEQ.length))
      if (SUPPORTED_LOCALES.includes(lang)) {
        return lang
      }
    }
  }

  // If no valid cookie, try browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0].toLowerCase()
    if (SUPPORTED_LOCALES.includes(browserLang)) {
      return browserLang
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
