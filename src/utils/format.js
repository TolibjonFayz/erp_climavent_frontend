// Jadval va kartalarda ishlatiladigan umumiy formatlash

const pad = (n) => String(n).padStart(2, '0')
const numberFmt = new Intl.NumberFormat('ru-RU')

/** 12345 → "12 345" */
export const fmtNum = (n) => numberFmt.format(n || 0)

/** → "28.02.2026" (bo'sh bo'lsa "—") */
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** → "28.02.2026 14:05" */
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Ikki sana orasidagi vaqt: "2 soat 15 daq" (t — i18n funksiyasi) */
export function formatSpan(from, to, t) {
  if (!from || !to) return ''
  const mins = Math.round((new Date(to) - new Date(from)) / 60000)
  if (!Number.isFinite(mins) || mins < 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h >= 24) return `${Math.floor(h / 24)} ${t('uiDayShort')} ${h % 24} ${t('amoHourShort')}`
  if (h) return `${h} ${t('amoHourShort')} ${m} ${t('amoMinShort')}`
  return `${m} ${t('amoMinShort')}`
}

/** Faqat raqamlar */
export const digitsOf = (s) => String(s || '').replace(/[^0-9]/g, '')

/** tel: havola (9 xonali mahalliy raqamga 998 qo'shiladi) */
export function telHref(phone) {
  const d = digitsOf(phone)
  if (!d) return undefined
  return `tel:+${d.length === 9 ? `998${d}` : d}`
}

// Hafta dushanbadan boshlanadi
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Bugun / shu hafta / shu oy boshlanish sanalari */
export function periodStarts(now = new Date()) {
  const today = startOfDay(now)
  const week = new Date(today)
  week.setDate(week.getDate() - ((week.getDay() + 6) % 7))
  return { today, week, month: new Date(now.getFullYear(), now.getMonth(), 1) }
}

/** Ro'yxatdan sana maydoni bo'yicha bugun/hafta/oy sonlari */
export function countByPeriod(list, getDate = (x) => x.createdAt) {
  const p = periodStarts()
  const res = { today: 0, week: 0, month: 0 }
  for (const item of list || []) {
    const v = getDate(item)
    if (!v) continue
    const d = new Date(v)
    if (d >= p.today) res.today++
    if (d >= p.week) res.week++
    if (d >= p.month) res.month++
  }
  return res
}
