import { createI18n } from 'vue-i18n'

// Faqat tanlangan til yuklanadi: ikkala til matnlari (~300 KB) birinchi ochilishda kerak emas.
// Ikkinchi til foydalanuvchi uni tanlagandagina alohida faylda yuklab olinadi.
const loaders = {
  uz: () =>
    Promise.all([import('./locales/uz.json'), import('./locales/sklad.js'), import('./locales/admin.js')]).then(
      ([base, sklad, admin]) => ({ ...base.default, ...sklad.uz, ...admin.uz }),
    ),
  ru: () =>
    Promise.all([import('./locales/ru.json'), import('./locales/sklad.js'), import('./locales/admin.js')]).then(
      ([base, sklad, admin]) => ({ ...base.default, ...sklad.ru, ...admin.ru }),
    ),
}

const SUPPORTED_LOCALES = Object.keys(loaders)

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
  messages: {},
})

/** Til matnlarini (bir marta) yuklaydi */
const loaded = {}
export async function loadLanguage(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) lang = 'uz'
  // merge — boshqa kirish nuqtalari (mobil ilovaning m.* matnlari) qo'shganlari o'chib ketmasin
  loaded[lang] ??= loaders[lang]()
    .then((messages) => i18n.global.mergeLocaleMessage(lang, messages))
    .catch((err) => {
      delete loaded[lang] // tarmoq xatosi — keyingi safar qayta urinamiz
      throw err
    })
  await loaded[lang]
  return lang
}

/** Tilni almashtiradi: avval matnlar yuklanadi, keyin interfeys o'tadi */
export async function setLanguage(lang) {
  lang = await loadLanguage(lang)
  if (typeof i18n.global.locale === 'object' && 'value' in i18n.global.locale) {
    i18n.global.locale.value = lang
  } else {
    i18n.global.locale = lang
  }
  return lang
}

export const currentLanguage = () =>
  typeof i18n.global.locale === 'object' ? i18n.global.locale.value : i18n.global.locale

export default i18n
