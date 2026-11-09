import { formatDateTime } from '@/utils/format'

// Butun ilovada sana bir xil ko'rinishda: 21.10.2026 14:05
export function formatDate(dateString) {
  if (!dateString) return 'Kiritilmagan'
  return formatDateTime(dateString)
}

export function formatDateShort(dateString) {
  return formatDateTime(dateString)
}

// Relative time (e.g. "2 hours ago")
export function formatDateRelative(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return formatDate(dateString)
  } else if (days > 0) {
    return `${days} kun oldin`
  } else if (hours > 0) {
    return `${hours} soat oldin`
  } else if (minutes > 0) {
    return `${minutes} daqiqa oldin`
  } else {
    return 'Hozirgina'
  }
}
