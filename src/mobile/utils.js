// Mobil ekranlar uchun kichik yordamchilar

const pad = (n) => String(n).padStart(2, '0')

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

const AVATAR_COLORS = ['#2a78d6', '#0d9488', '#7c3aed', '#d97706', '#db2777', '#15803d', '#4f46e5']

/** Ism bo'yicha doim bir xil avatar rangi */
export function avatarColor(name = '') {
  let h = 0
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(name = '') {
  // Qo'shtirnoq va belgilarni tashlab, faqat so'zlarning bosh harflari ("Ventstroy" MChJ → VM)
  const parts = String(name)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

const MONTHS = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
}

/** "Bugun 14:05", "Kecha 09:10", "12-okt", "12-okt 2025" */
export function smartDate(value, t, locale = 'uz', withTime = true) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const today = ymd(now)
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const key = ymd(d)
  const time = withTime ? ` ${hhmm(d)}` : ''
  if (key === today) return `${t('m.today')}${time}`
  if (key === ymd(yest)) return `${t('m.yesterday')}${time}`
  if (key === ymd(tomorrow)) return `${t('m.tomorrow')}${time}`
  const m = (MONTHS[locale] || MONTHS.uz)[d.getMonth()]
  const base = locale === 'ru' ? `${d.getDate()} ${m}` : `${d.getDate()}-${m}`
  const year = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${base}${year}${time}`
}

export const monthNames = {
  uz: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ],
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
}

/** Server xatosidan foydalanuvchiga ko'rsatiladigan matn */
export function errorText(error, t, locale = 'uz') {
  if (!error?.response) return t('m.networkError')
  const data = error.response.data || {}
  const msg = locale === 'ru' ? data.messageRu || data.message : data.message
  if (Array.isArray(msg)) return msg.join('\n')
  return msg || t('xatolikYuzBerdi')
}

/** Qidiruv uchun: kirill/lotin farqisiz kichik harf */
export const norm = (s) => String(s || '').toLowerCase().trim()
