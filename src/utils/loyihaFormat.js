// Loyihachilar sahifalari (ro'yxat + detail) uchun umumiy formatlash yordamchilari

export const formatNumber = (value) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(value) || 0)

// Sanalar butun saytda bir xil ko'rinishda: 28.02.2026 / 28.02.2026 14:05
export { formatDate, formatDateTime } from './format'

export const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024) + ' KB'
  return n + ' B'
}

// 1-3 yashil, 4-7 sariq, 8-10 qizil (el-tag turi)
export const difficultyTag = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return 'danger'
  if (n >= 4) return 'warning'
  return 'success'
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
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(value) || 0)
}
