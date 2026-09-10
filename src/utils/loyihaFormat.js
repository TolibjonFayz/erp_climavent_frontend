// Loyihachilar sahifalari (ro'yxat + detail) uchun umumiy formatlash yordamchilari

export const formatNumber = (value) =>
  new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('uz-UZ')
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.toLocaleDateString('uz-UZ')} ${time}`
}

export const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024) + ' KB'
  return n + ' B'
}

// 1-3 yashil, 4-7 sariq, 8-10 qizil
export const difficultyClass = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return 'diff-high'
  if (n >= 4) return 'diff-mid'
  return 'diff-low'
}

export const fullName = (user) =>
  user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : ''

// Loyiha id — nol bilan to'ldirilgan ko'rinishda: 1 -> "0001"
export const formatLoyihaId = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return String(value).padStart(4, '0')
}

export const LOYIHA_STATUS_OPTIONS = [
  { value: 'in_progress', labelKey: 'loyihaStatusInProgress', icon: '🔧' },
  { value: 'done', labelKey: 'loyihaStatusDone', icon: '✅' },
]

export const statusLabelKey = (status) =>
  status === 'done' ? 'loyihaStatusDone' : 'loyihaStatusInProgress'

export const statusClass = (status) => (status === 'done' ? 'status-done' : 'status-progress')

// Pul summasi: 1189776 -> "1 189 776"
export const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(Number(value) || 0)
}
