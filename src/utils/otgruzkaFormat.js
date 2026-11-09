// Otgruzka bo'limi uchun formatlash va xato matnlari
import i18n from '@/i18n'
import { fmtNum } from '@/utils/format'

const t = (...a) => i18n.global.t(...a)
const te = (k) => i18n.global.te(k)

/** 1234567.4 → "1 234 567" (so'm, tiyinsiz) */
export const fmtMoney = (n) => fmtNum(Math.round(Number(n) || 0))

/** 1234567890 → "1,23 mlrd" — ko'rsatkich kartalari uchun qisqa ko'rinish */
export function fmtShort(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  const ru = i18n.global.locale.value === 'ru'
  const fmt = (x) => x.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
  if (abs >= 1e9) return `${fmt(v / 1e9)} ${ru ? 'млрд' : 'mlrd'}`
  if (abs >= 1e6) return `${fmt(v / 1e6)} ${ru ? 'млн' : 'mln'}`
  return fmtMoney(v)
}

/** 0.955 → "96%" */
export const fmtPct = (p) => `${Math.round((Number(p) || 0) * 100)}%`

/** Server xatosi → tanlangan tildagi matn (kod bo'yicha) */
export function otError(error, fallbackKey = 'otLoadError') {
  const data = error?.response?.data || error || {}
  if (data.code && te(`otErr_${data.code}`)) return t(`otErr_${data.code}`, data.params || {})
  if (Array.isArray(data.message)) return data.message.join('; ')
  return data.message || t(fallbackKey)
}

// Holat ranglari (UI tokenlari: good / warn / bad / link / muted)
export const STAGE_TONE = {
  waiting: 'muted',
  ready: 'warn',
  partial: 'link',
  shipped: 'warn',
  done: 'good',
  refused: 'bad',
  returned: 'bad',
  stopped: 'bad',
  stock: 'muted',
}
// Mahsulotning ombordagi tayyorligi: ready — to'liq, partial — qisman, none — yo'q, unknown — omborda topilmadi
export const STOCK_TONE = { ready: 'good', partial: 'warn', none: 'bad', unknown: 'muted' }
export const PAY_TONE = { paid: 'good', partial: 'warn', unpaid: 'bad', none: 'muted' }
export const STAGES = ['waiting', 'ready', 'partial', 'shipped', 'done', 'refused', 'returned', 'stopped', 'stock']
export const FINAL_STAGES = ['refused', 'returned', 'stopped', 'stock']
export const PAYS = ['unpaid', 'partial', 'paid', 'none']
export const SERIES = ['cv_official', 'cv_unofficial', 'jv_official', 'jv_unofficial', 'other']
export const ALERTS = ['shipped_unpaid', 'ready_waiting', 'paid_not_shipped', 'didox_missing', 'overdue', 'zero_sum']

/** Tarixdagi `change` yozuvi qiymatini o'qiladigan qilish */
export function changeValue(field, v) {
  if (v === null || v === undefined || v === '') return t('otEmpty')
  if (field === 'ready_pct' || field === 'shipped_pct') return fmtPct(v)
  if (field === 'contract_sum') return fmtMoney(v)
  if (field === 'didox_contract' || field === 'didox_poa') return v === true ? t('otYes') : v === false ? t('otNo') : t('otNa')
  if (field === 'final_status') return t(`otStage_${v}`)
  return String(v)
}

// Didox filtri: ok — shartnoma va ishonchnoma bor; missing — biri yo'q; pending — hali belgilanmagan;
// files / nofiles — schyot-faktura fayli yuklangan / yuklanmagan (rasmiy shartnomalar); na — Didox kerak emas
export const DIDOX_FILTERS = ['ok', 'missing', 'pending', 'files', 'nofiles', 'na']
export function didoxStateOf(r) {
  if (!r.official) return 'na'
  if (r.didox_contract === false || r.didox_poa === false) return 'missing'
  if (r.didox_contract === true && r.didox_poa === true) return 'ok'
  return 'pending'
}
export function matchDidox(r, f) {
  if (!f) return true
  if (f === 'files') return (r.didox_files_count || 0) > 0
  if (f === 'nofiles') return r.official && !(r.didox_files_count > 0)
  return didoxStateOf(r) === f
}

/** Fayl hajmi: 1536 → "1.5 KB" */
export function fmtSize(n) {
  const b = Number(n) || 0
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
