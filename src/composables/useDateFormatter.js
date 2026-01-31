export function formatDate(dateString) {
  if (!dateString) return 'Kiritilmagan'
  const date = new Date(dateString)

  const months = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-yil, ${day}-${month}, ${hours}:${minutes}`
}

export function formatDateShort(dateString) {
  const date = new Date(dateString)

  const months = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}-${month}, ${hours}:${minutes}`
}

// Nisbiy vaqt (masalan: "2 soat oldin")
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
