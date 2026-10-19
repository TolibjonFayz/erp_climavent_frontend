import * as XLSX from 'xlsx'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isNative } from './native'

// Ustun kengligi: eng uzun qiymat bo'yicha (saytdagi calcColWidths)
function colWidths(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0]).map((key) => ({
    wch: Math.min(60, Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2),
  }))
}

const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/**
 * Excel fayl yasab ulashadi.
 * sheets: [{ name, rows: [{ ustun: qiymat }] }]
 * Telefonda — tizimning "Ulashish" oynasi (Telegram, Drive, fayllar...),
 * brauzerda — oddiy yuklab olish.
 */
export async function exportExcel(baseName, sheets, title) {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows)
    ws['!cols'] = colWidths(s.rows)
    XLSX.utils.book_append_sheet(wb, ws, String(s.name).slice(0, 31))
  }
  const fileName = `${baseName}_${stamp()}.xlsx`

  if (!isNative) {
    XLSX.writeFile(wb, fileName)
    return
  }
  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  const written = await Filesystem.writeFile({
    path: fileName,
    data,
    directory: Directory.Cache,
  })
  await Share.share({ title: title || fileName, files: [written.uri] }).catch((e) => {
    // Foydalanuvchi ulashish oynasini yopsa — xato emas
    if (!/cancel/i.test(String(e?.message || e))) throw e
  })
}

/** HTML hujjatni fayl qilib ulashish (chop etish ishlamagan qurilmalar uchun zaxira) */
export async function shareHtml(baseName, html, title) {
  const fileName = `${baseName}.html`
  if (!isNative) {
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
    return
  }
  const written = await Filesystem.writeFile({
    path: fileName,
    data: html,
    directory: Directory.Cache,
    encoding: 'utf8',
  })
  await Share.share({ title: title || fileName, files: [written.uri] }).catch(() => {})
}
