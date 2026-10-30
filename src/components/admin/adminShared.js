// Admin panel tablari uchun umumiy narsalar: hamkor turlari, eski audit jurnali, Excel eksport
import * as XLSX from 'xlsx'
import {
  Delete,
  Document,
  Download,
  Edit,
  Key,
  Lock,
  Plus,
  StarFilled,
  Unlock,
  User,
  View,
} from '@element-plus/icons-vue'
import { useAuditLog } from '@/composables/useAuditLog'
import { errorText } from '@/utils/errorText'
import { formatDateTime } from '@/utils/format'

// Eski admin audit jurnali — barcha tablar bitta holatni ko'rsin (dashboard, jurnal, eksport)
let audit = null
export function useAdminAudit() {
  if (!audit) audit = useAuditLog()
  return audit
}

export const PARTNER_TYPES = [
  { value: 'doimiymijoz', key: 'admPtRegular', color: '#409eff' },
  { value: 'montajnik', key: 'admPtInstallers', color: '#67c23a' },
  { value: 'quruvchi', key: 'admPtBuilder', color: '#e6a23c' },
  { value: 'dokonbozor', key: 'admPtShop', color: '#f56c6c' },
  { value: 'proyektinstitut', key: 'admPtInstitute', color: '#909399' },
  { value: 'tenderfirmalar', key: 'admPtTender', color: '#9b59b6' },
  { value: 'uks', key: 'admPtUks', color: '#1abc9c' },
  { value: 'boshqa', key: 'admPtOther', color: '#e67e22' },
]

export function partnerTypeLabel(t, value) {
  const type = PARTNER_TYPES.find((p) => p.value === value)
  return type ? t(type.key) : value || '—'
}

/** Sana-vaqt yoki "Kiritilmagan" */
export const dateOrEmpty = (t, value) => (value ? formatDateTime(value) : t('admNotEntered'))

// Sarlavhadagi sana: "30-oktabr 2026, juma" / "30 октября 2026 г., пятница"
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
export function todayLabel(locale, d = new Date()) {
  if (locale === 'ru') {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(d)
  }
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${UZ_WEEKDAYS[d.getDay()]}`
}

// ─── Eski audit yozuvlari ───
export const logActor = (l) =>
  (typeof l.actor === 'string' && l.actor) ||
  (l.admin ? `${l.admin.firstname ?? ''} ${l.admin.lastname ?? ''}`.trim() : '') ||
  '—'
export const logTime = (l) => l.time || formatDateTime(l.createdAt || l.created_at) || '—'

const AUDIT_ICONS = { role: StarFilled, block: Lock, unblock: Unlock, view: View, create: Plus, edit: Edit, delete: Delete, password: Key, export: Download, login: User }
export const auditIcon = (action) => AUDIT_ICONS[action] || Document

const AUDIT_LABELS = {
  role: 'admActRole',
  block: 'admActBlock',
  unblock: 'admActUnblock',
  view: 'admActView',
  create: 'admActCreate',
  edit: 'admActEdit',
  delete: 'admActDelete',
  password: 'admActPassword',
  export: 'admActExport',
  login: 'admActLogin',
}
export const auditLabel = (t, action) => (AUDIT_LABELS[action] ? t(AUDIT_LABELS[action]) : action)

// ─── Excel ───
function colWidths(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, ...rows.map((row) => String(row[key] ?? '').length)) + 3,
  }))
}

/** Qatorlarni Excel faylga yozadi; bo'sh bo'lsa false */
export function exportSheet(rows, sheetName, filePrefix) {
  if (!rows.length) return false
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = colWidths(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filePrefix}_${new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`)
  return true
}

/** Bir nechta yozuvni ketma-ket o'chiradi; birortasi o'tmasa ham qolganlari davom etadi */
export async function deleteMany(rows, remove) {
  let ok = 0
  const failed = []
  for (const row of rows) {
    try {
      await remove(row)
      ok++
    } catch (err) {
      failed.push(errorText(err, `#${row.id}`))
    }
  }
  return { ok, failed }
}
