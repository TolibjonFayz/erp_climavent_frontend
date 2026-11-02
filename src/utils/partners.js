import i18n, { currentLanguage } from '@/i18n'

const { t } = i18n.global

/**
 * Bazadagi manzil nomini joriy tilda ko'rsatadi. Yangi yozuvlarda doimiy o'zbekcha nom
 * ("Toshkent shahri", "Chilonzor") — u tarjima kaliti ham. Eski yozuvlar: "toshkent_shahri".
 */
export function formatLocationName(text) {
  if (!text) return ''
  // te()/t() kalitni yo'l sifatida o'qiydi — "O'zbekiston" dagi apostrof uni buzadi, shuning uchun to'g'ridan-to'g'ri
  const translated = i18n.global.getLocaleMessage(currentLanguage())[text]
  if (typeof translated === 'string') return translated
  if (/^[a-z_']+$/.test(text)) return text.replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase())
  return text
}

// Mijoz turi bazada doimiy o'zbekcha nom bilan saqlanadi; eski ruscha yozuvlar ham taniladi
const LEGAL_TYPES = {
  'Yuridik shaxs': 'yuridikShaxs',
  'Юридическое лицо': 'yuridikShaxs',
  'Jismoniy shaxs': 'jismoniyShaxs',
  'Физическое лицо': 'jismoniyShaxs',
}
export const LEGAL_TYPE_VALUES = { yuridik: 'Yuridik shaxs', jismoniy: 'Jismoniy shaxs' }

/** Eski (ruscha) yozuvni ham doimiy qiymatga keltiradi — tahrirlash formasi uchun */
export function legalTypeValue(mijozturi) {
  const key = LEGAL_TYPES[mijozturi]
  return key ? LEGAL_TYPE_VALUES[key === 'yuridikShaxs' ? 'yuridik' : 'jismoniy'] : mijozturi || ''
}

/** Mijoz turi joriy tilda */
export function legalTypeLabel(mijozturi) {
  const key = LEGAL_TYPES[mijozturi]
  return key ? t(key) : mijozturi || ''
}

/** Element Plus tag type for a customer's legal form. */
export function partnerTypeTag(mijozturi) {
  return LEGAL_TYPES[mijozturi] === 'yuridikShaxs' ? 'success' : 'warning'
}

const PARTNER_TYPE_LABELS = {
  doimiymijoz: 'Doimiy mijoz',
  montajnik: 'Montajnik',
  quruvchi: 'Quruvchi',
  dokonchitadbirkor: "Do'konchi tadbirkor",
  proyektinstitut: 'Proyekt institut',
  tenderfirmalar: 'Tender firmasi',
  uks: 'UKS tashkiloti',
  boshqa: 'Boshqa',
}

/** Human-readable label for a partner_type key. */
export function partnerTypeLabel(type) {
  return PARTNER_TYPE_LABELS[type] || type
}
