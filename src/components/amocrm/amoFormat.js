// amoCRM statistikasi uchun umumiy formatlash va yorliqlar

// amoCRM'dagi asl status matnlari (tooltip'da ko'rsatiladi)
export const AMO_CALL_STATUS_RU = {
  1: 'Оставил сообщение',
  2: 'Перезвонить позже',
  3: 'Нет на месте',
  4: 'Разговор состоялся',
  5: 'Неверный номер',
  6: 'Не дозвонился',
  7: 'Номер занят',
}

export const TALKED = 4

// Qo'ng'iroq natijasi yo'nalishga qarab boshqacha o'qiladi:
// kiruvchida "javob bermadi" — biz, chiquvchida — mijoz.
export const callStatusKey = (direction, status) =>
  `${direction === 'in' ? 'amoCallIn_' : 'amoCallOut_'}${status || 0}`

const pad = (n) => String(n).padStart(2, '0')

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const numberFmt = new Intl.NumberFormat('ru-RU')
export const fmtNum = (n) => numberFmt.format(n || 0)

export function fmtDuration(sec, t) {
  const s = Number(sec) || 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h} ${t('amoHourShort')} ${m} ${t('amoMinShort')}`
  if (m) return `${m} ${t('amoMinShort')} ${s % 60} ${t('amoSecShort')}`
  return `${s} ${t('amoSecShort')}`
}

export const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)

// tel: havola uchun faqat raqamlar (+ bilan)
export const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (!digits) return null
  // 9 xonali mahalliy raqam — O'zbekiston kodi qo'shiladi
  return `tel:+${digits.length === 9 ? `998${digits}` : digits}`
}

// Brauzerlar (Chrome ham) davlat nomlarini o'zbekchada bermaydi — inglizcha
// qaytaradi. Shuning uchun backend ro'yxatidagi davlatlar nomi shu yerda.
const COUNTRY_UZ = {
  UZ: "O'zbekiston",
  RU: 'Rossiya',
  KZ: "Qozog'iston",
  TJ: 'Tojikiston',
  TM: 'Turkmaniston',
  KG: "Qirg'iziston",
  AZ: 'Ozarbayjon',
  GE: 'Gruziya',
  AM: 'Armaniston',
  BY: 'Belarus',
  UA: 'Ukraina',
  MD: 'Moldova',
  TR: 'Turkiya',
  CN: 'Xitoy',
  HK: 'Gonkong',
  TW: 'Tayvan',
  KR: 'Janubiy Koreya',
  JP: 'Yaponiya',
  VN: 'Vyetnam',
  TH: 'Tailand',
  MY: 'Malayziya',
  ID: 'Indoneziya',
  SG: 'Singapur',
  IN: 'Hindiston',
  PK: 'Pokiston',
  AF: "Afg'oniston",
  BD: 'Bangladesh',
  IR: 'Eron',
  AE: 'BAA',
  SA: 'Saudiya Arabistoni',
  QA: 'Qatar',
  KW: 'Quvayt',
  OM: 'Ummon',
  BH: 'Bahrayn',
  JO: 'Iordaniya',
  IQ: 'Iroq',
  LB: 'Livan',
  IL: 'Isroil',
  EG: 'Misr',
  US: 'AQSH / Kanada',
  GB: 'Buyuk Britaniya',
  DE: 'Germaniya',
  FR: 'Fransiya',
  IT: 'Italiya',
  ES: 'Ispaniya',
  NL: 'Niderlandiya',
  BE: 'Belgiya',
  CH: 'Shveytsariya',
  AT: 'Avstriya',
  PL: 'Polsha',
  CZ: 'Chexiya',
  SE: 'Shvetsiya',
  NO: 'Norvegiya',
  DK: 'Daniya',
  FI: 'Finlandiya',
  LT: 'Litva',
  LV: 'Latviya',
  EE: 'Estoniya',
  GR: 'Gretsiya',
  HU: 'Vengriya',
  RO: 'Ruminiya',
  BG: 'Bolgariya',
  RS: 'Serbiya',
  AU: 'Avstraliya',
}

// Davlat nomi ISO kodi bo'yicha. XX — aniqlanmagan.
const regionNames = {}
export function countryName(code, locale, t) {
  if (!code || code === 'XX') return t('amoCountryUnknown')
  if (locale === 'uz' && COUNTRY_UZ[code]) return COUNTRY_UZ[code]
  // +1 — AQSH ham, Kanada ham
  if (code === 'US' && locale === 'ru') return 'США / Канада'
  try {
    regionNames[locale] ||= new Intl.DisplayNames([locale, 'ru'], { type: 'region' })
    return regionNames[locale].of(code) || code
  } catch {
    return code
  }
}

export function fmtBytes(bytes) {
  const b = Number(bytes) || 0
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${Math.round(b / 1024)} KB`
}

// Brauzerlarda o'zbekcha oy nomlari bo'lmasligi mumkin — o'zimiz beramiz
export const MONTHS = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
}
