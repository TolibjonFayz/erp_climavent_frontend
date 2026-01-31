import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

const messages = {
  uz,
  ru,
}

// Cookie'dan tilni o'qish
function getCookieLanguage(name = 'lang') {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return 'uz'
}

const i18n = createI18n({
  locale: getCookieLanguage(),
  globalInjection: true,
  messages,
})

export default i18n
