// Loyiha darajasi rangi: 1-3 yashil, 4-7 sariq, 8-10 qizil (saytdagi difficultyTag bilan bir xil)
export function difficultyTone(value) {
  const n = Number(value) || 0
  if (n >= 8) return 'is-bad'
  if (n >= 4) return 'is-warn'
  return 'is-good'
}

export const difficultyLabelKey = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return 'loyihaDifficultyHigh'
  if (n >= 4) return 'loyihaDifficultyMid'
  return 'loyihaDifficultyLow'
}

// Fayl turi belgisi
export function fileIcon(name = '') {
  const ext = String(name).split('.').pop().toLowerCase()
  if (ext === 'pdf') return '📕'
  if (['doc', 'docx'].includes(ext)) return '📘'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['dwg', 'dxf'].includes(ext)) return '📐'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📄'
}

export const LOYIHA_MAX_MB = 200
