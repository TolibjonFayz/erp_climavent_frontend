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
