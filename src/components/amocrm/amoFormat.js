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
