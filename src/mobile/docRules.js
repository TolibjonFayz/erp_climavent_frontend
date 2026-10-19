// KP va Dogovor uchun umumiy qoidalar (saytdagi KP.vue / Dogovor.vue va backend bilan bir xil)

// Kiritgan xodim 2 kun ichida o'z yozuvini tahrirlaydi/o'chiradi, keyin faqat admin
export const EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

export function canModifyDoc(row, user) {
  if (!row || !user) return false
  if (user.is_admin) return true
  if (row.created_by == null || Number(row.created_by) !== Number(user.id)) return false
  const created = new Date(row.createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= EDIT_WINDOW_MS
}

// Tahrirlash oynasi qancha qoldi (soat), oddiy xodim uchun
export function editHoursLeft(row) {
  const created = new Date(row?.createdAt).getTime()
  if (Number.isNaN(created)) return 0
  return Math.max(0, Math.ceil((EDIT_WINDOW_MS - (Date.now() - created)) / 3600000))
}

export const KP_STATUSES = [
  { value: 'Open', labelKey: 'kpStatusOpen', tone: 'is-blue' },
  { value: 'Negotiation', labelKey: 'kpStatusNegotiation', tone: 'is-warn' },
  { value: 'Closed', labelKey: 'kpStatusClosed', tone: 'is-good' },
]

export const DOGOVOR_STATUSES = [
  { value: 'Open', labelKey: 'dogovorStatusOpen', tone: 'is-blue' },
  { value: 'PartlyShipped', labelKey: 'dogovorStatusPartlyShipped', tone: 'is-warn' },
  { value: 'Shipped', labelKey: 'dogovorStatusShipped', tone: 'is-good' },
  { value: 'Closed', labelKey: 'dogovorStatusClosed', tone: '' },
]

export const statusOf = (list, value) => list.find((s) => s.value === value)
