// Ombor (sklad) bo'limi uchun formatlash
import i18n from '@/i18n'

const t = (...args) => i18n.global.t(...args)

/** "2026-10" → "Oktyabr 2026" */
export function periodLabel(period) {
  if (!period) return ''
  const [y, m] = period.split('-')
  return `${t(`skMonth${Number(m)}`)} ${y}`
}

/** Miqdor: 12345.5 → "12 345,5" */
const qtyFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 })
export const fmtQty = (n) => qtyFmt.format(Number(n) || 0)

/** Harakat turi nomi */
export const moveTypeLabel = (type) => t(`skType_${type}`)

/** Qoldiqqa ta'siri bo'yicha belgili miqdor: "+5" / "−3" */
export function signedQty(type, qty) {
  const sign = { in: 1, release: 1, out: -1, reserve: -1 }[type]
  if (type === 'adjust') return `${qty > 0 ? '+' : '−'}${fmtQty(Math.abs(qty))}`
  if (type === 'snapshot') return `= ${fmtQty(qty)}`
  return `${sign > 0 ? '+' : '−'}${fmtQty(qty)}`
}

/** "2026-10-20" → "20.10" (qisqa, jadval uchun) */
export function shortDate(d) {
  if (!d) return '—'
  const [, m, day] = String(d).slice(0, 10).split('-')
  return `${day}.${m}`
}

/** "2026-02" → "2026-02-28" */
export function lastDayOfPeriod(period) {
  if (!period) return ''
  const [y, m] = period.split('-').map(Number)
  return `${period}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// ─── Til bo'yicha tarjima: bazadagi kodlar va backend xatolari ───────────

const te = (key) => i18n.global.te(key)

/** O'lchov birliklari (bazada kod saqlanadi, nomi tilga qarab) */
export const UNIT_CODES = ['dona', 'm', 'm2', 'kg', 'komplekt']

/** "dona" → "шт." (ru) / "dona" (uz); noma'lum birlik o'zicha ko'rsatiladi */
export function unitLabel(unit) {
  if (!unit) return ''
  return te(`skUnit_${unit}`) ? t(`skUnit_${unit}`) : unit
}

/** Tizim izohi ("sys:opening") → tarjima; foydalanuvchi izohi o'zgarmaydi */
export function moveComment(comment) {
  if (!comment) return ''
  if (!comment.startsWith('sys:')) return comment
  const key = `skSys_${comment.slice(4)}`
  return te(key) ? t(key) : ''
}

/**
 * Backend xatosi → foydalanuvchi tilidagi matn.
 * Ombor endpointlari `{ code, params, message }` qaytaradi; kod tarjimasi bo'lmasa —
 * serverning o'z matni, u ham bo'lmasa — umumiy xato.
 */
export function apiError(error, fallbackKey = 'skError') {
  const data = error?.response?.data || error || {}
  return codeMessage(data.code, data.params, data.message) || t(fallbackKey)
}

/** Kod + parametrlar → matn (sinxron natijasi uchun ham) */
export function codeMessage(code, params, message) {
  if (code && te(`skErr_${code}`)) {
    const p = { ...(params || {}) }
    if (p.unit) p.unit = unitLabel(p.unit)
    for (const k of ['balance', 'qty']) if (p[k] != null) p[k] = fmtQty(p[k])
    return t(`skErr_${code}`, p)
  }
  if (Array.isArray(message)) return message.join('; ')
  return message || ''
}

/** Sinxron ogohlantirishi ({ item, kind, ... }) → matn; eski satr ko'rinishi ham qabul qilinadi */
export function syncWarning(w) {
  if (typeof w === 'string') return w
  const p = { ...w }
  for (const k of ['daily', 'total', 'fact', 'computed']) if (p[k] != null) p[k] = fmtQty(p[k])
  return t(`skWarn_${w.kind}`, p)
}

// ─── SAP: xodimlar mahsulotni SAP kodi va nomi bilan taniydi ───────────

const nameKey = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[хx*×]/g, 'x')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')

/** Ko'rsatiladigan nom: SAP nomi bo'lsa — u, bo'lmasa jadvaldagi nom */
export const itemName = (it) => it?.sap_name || it?.name || ''

/** Jadvaldagi nom SAP nomidan farq qilsa — shu nom (izoh sifatida ko'rsatish uchun) */
export const sheetNameIfDiff = (it) =>
  it?.sap_name && nameKey(it.sap_name) !== nameKey(it.name) ? it.name : ''
