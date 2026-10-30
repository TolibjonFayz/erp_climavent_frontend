// Faoliyat jurnali yozuvlarini odam tilida ko'rsatish (t — vue-i18n tarjima funksiyasi)

const ONLINE_MS = 3 * 60 * 1000

/** Oxirgi so'rov 3 daqiqa ichida bo'lsa — "hozir onlayn" */
export const isOnline = (lastSeen) =>
  !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_MS

const pad = (n) => String(n).padStart(2, '0')
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const day = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`

/** "Hozir onlayn" · "12 daqiqa oldin" · "bugun 14:20" · "kecha 09:05" · "3 kun oldin" · "28.10.2026" */
export function lastSeenText(t, value) {
  if (!value) return t('actNeverLoggedIn')
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  if (diff < ONLINE_MS) return t('actOnlineNow')
  const mins = Math.round(diff / 60000)
  if (mins < 60) return t('actMinAgo', { n: mins })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (d >= today) return t('actTodayAt', { x: hm(d) })
  if (d >= new Date(today.getTime() - 86400000)) return t('actYesterdayAt', { x: hm(d) })
  const days = Math.floor((today - d) / 86400000) + 1
  if (days < 7) return t('actDaysAgo', { n: days })
  return day(d)
}

// Amal → rang va ikonka; matn — actA_<amal> kaliti
const ACTIONS = {
  login: { color: 'good', icon: 'SwitchButton' },
  logout: { color: 'muted', icon: 'Back' },
  login_failed: { color: 'bad', icon: 'WarningFilled' },
  login_blocked: { color: 'bad', icon: 'Lock' },
  create: { color: 'link', icon: 'Plus' },
  update: { color: 'warn', icon: 'Edit' },
  delete: { color: 'bad', icon: 'Delete' },
  import: { color: 'violet', icon: 'Upload' },
  export: { color: 'violet', icon: 'Download' },
  password: { color: 'warn', icon: 'Key' },
  view: { color: 'muted', icon: 'View' },
  role: { color: 'warn', icon: 'StarFilled' },
  block: { color: 'bad', icon: 'Lock' },
  unblock: { color: 'good', icon: 'Unlock' },
  action: { color: 'muted', icon: 'Operation' },
}
export const actionMeta = (a) => ACTIONS[a] || ACTIONS.action

// Kalit topilmasa — asl qiymat (yangi bo'lim yoki jadval qo'shilsa ham jurnal ishlayveradi)
const tr = (t, key, fallback) => {
  const s = t(key)
  return s === key ? fallback : s
}
const slug = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_')

export const actionLabel = (t, a) => tr(t, `actA_${a}`, a)
// URL bo'limi → nom (partners → Mijozlar)
export const MODULES = [
  'users',
  'partners',
  'come-and-goes',
  'come-and-go-inside',
  'location-videos',
  'tasks',
  'attendance',
  'kp',
  'dogovor',
  'competitors',
  'loyiha',
  'sklad',
  'training',
  'boss',
  'announcements',
  'amocrm',
  'app-releases',
  'admin',
]
export const moduleLabel = (t, m) => (m ? tr(t, `actM_${slug(m)}`, m) : '—')
// Jadval → birlik nomi ("mijoz", "KP"...)
export const tableLabel = (t, table) => (table ? tr(t, `actT_${slug(table)}`, table) : '')
export const fieldLabel = (t, f) => tr(t, `actF_${slug(f)}`, f)

/** Bir qatorli tavsif: "Mijoz qo'shdi: «Aziz Grand»" / "Добавил — клиент: «Aziz Grand»" */
export function describe(t, row) {
  const a = row.action
  if (a === 'login_failed' || a === 'login_blocked') {
    if (!row.error) return actionLabel(t, a)
    // Backend sababni o'zbekcha yozadi — ma'lumlarini tarjima qilamiz
    const key = LOGIN_ERRORS[row.error]
    return t('actLoginAttempt', { e: key ? t(key) : row.error.toLowerCase() })
  }
  if (a === 'login' || a === 'logout' || a === 'password') return actionLabel(t, a)
  if (row.module === 'admin' && row.entity_label) return row.entity_label
  const what = tableLabel(t, row.entity_type) || moduleLabel(t, row.module).toLowerCase()
  const verb = tr(t, `actVerb_${a}`, actionLabel(t, a).toLowerCase())
  const head = t('actSentence', { what, verb, What: cap(what), Verb: cap(verb) })
  const name = row.entity_label ? `«${row.entity_label}»` : row.entity_id ? `#${row.entity_id}` : ''
  return name ? `${head}: ${name}` : head
}
const LOGIN_ERRORS = {
  "Parol noto'g'ri": 'actErrWrongPassword',
  "Bunday login yo'q": 'actErrNoUser',
  'Akkount bloklangan': 'actErrBlocked',
}
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** Brauzer satridan qurilma: "Telefon ilovasi · Android" / "Sayt · Chrome, Windows" */
export function deviceText(t, row) {
  const ua = row.user_agent || ''
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iOS/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : ''
  if (row.platform === 'mobile') return [t('actMobileApp'), os].filter(Boolean).join(' · ')
  const br = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : ''
  return [t('actWebsite'), [br, os].filter(Boolean).join(', ')].filter(Boolean).join(' · ')
}

export function fmtValue(t, v) {
  if (v === null || v === undefined || v === '') return '—'
  if (v === true) return t('actYes')
  if (v === false) return t('actNo')
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return `${day(d)} ${hm(d)}`
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
