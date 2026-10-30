// Faoliyat jurnali yozuvlarini odam tilida ko'rsatish

const ONLINE_MS = 3 * 60 * 1000

/** Oxirgi so'rov 3 daqiqa ichida bo'lsa — "hozir onlayn" */
export const isOnline = (lastSeen) =>
  !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_MS

const pad = (n) => String(n).padStart(2, '0')
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** "Hozir onlayn" · "12 daqiqa oldin" · "bugun 14:20" · "kecha 09:05" · "28.10.2026" */
export function lastSeenText(value) {
  if (!value) return 'Hali kirmagan'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  if (diff < ONLINE_MS) return 'Hozir onlayn'
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins} daqiqa oldin`
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (d >= today) return `bugun ${hm(d)}`
  if (d >= new Date(today.getTime() - 86400000)) return `kecha ${hm(d)}`
  const days = Math.floor((today - d) / 86400000) + 1
  if (days < 7) return `${days} kun oldin`
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export const ACTIONS = {
  login: { label: 'Tizimga kirdi', tag: 'Kirish', color: 'good', icon: 'SwitchButton' },
  logout: { label: 'Tizimdan chiqdi', tag: 'Chiqish', color: 'muted', icon: 'Back' },
  login_failed: { label: 'Kirishga urindi — muvaffaqiyatsiz', tag: 'Xato kirish', color: 'bad', icon: 'WarningFilled' },
  login_blocked: { label: 'Bloklangan akkount bilan kirishga urindi', tag: 'Blok', color: 'bad', icon: 'Lock' },
  create: { label: "Qo'shdi", tag: "Qo'shish", color: 'link', icon: 'Plus' },
  update: { label: "O'zgartirdi", tag: 'Tahrir', color: 'warn', icon: 'Edit' },
  delete: { label: "O'chirdi", tag: "O'chirish", color: 'bad', icon: 'Delete' },
  import: { label: 'Import qildi', tag: 'Import', color: 'violet', icon: 'Upload' },
  export: { label: 'Eksport qildi', tag: 'Eksport', color: 'violet', icon: 'Download' },
  password: { label: "Parolni o'zgartirdi", tag: 'Parol', color: 'warn', icon: 'Key' },
  view: { label: "Ko'rdi", tag: "Ko'rish", color: 'muted', icon: 'View' },
  role: { label: "Rolini o'zgartirdi", tag: 'Rol', color: 'warn', icon: 'StarFilled' },
  block: { label: 'Blokladi', tag: 'Blok', color: 'bad', icon: 'Lock' },
  unblock: { label: 'Blokdan chiqardi', tag: 'Blokdan', color: 'good', icon: 'Unlock' },
  action: { label: 'Amal bajardi', tag: 'Amal', color: 'muted', icon: 'Operation' },
}
export const actionMeta = (a) => ACTIONS[a] || { label: a, tag: a, color: 'muted', icon: 'Operation' }

// URL bo'limi → nom
export const MODULES = {
  users: 'Foydalanuvchilar',
  partners: 'Mijozlar',
  'come-and-goes': 'Obyektlar',
  'come-and-go-inside': 'Obyekt tashriflari',
  'location-videos': 'Obyekt videolari',
  tasks: 'Vazifalar',
  attendance: 'Davomat',
  kp: 'KP',
  dogovor: 'Shartnomalar',
  competitors: 'Raqiblar',
  loyiha: 'Loyihalar',
  sklad: 'Ombor',
  training: "O'qitish",
  boss: 'Boss',
  announcements: "E'lonlar",
  amocrm: 'amoCRM',
  'app-releases': 'Ilova versiyalari',
  admin: 'Admin panel',
}
export const moduleLabel = (m) => MODULES[m] || m || '—'

// Jadval → birlik nomi ("mijoz", "KP"...)
const TABLES = {
  partners: 'mijoz',
  comeandgo: 'obyekt',
  comeandgoinside: 'obyekt tashrifi',
  location_videos: 'video',
  tasks: 'vazifa',
  attendance: 'davomat',
  attendance_events: 'davomat belgisi',
  kp: 'KP',
  dogovor: 'shartnoma',
  competitors: 'raqib',
  competitor_encounters: 'raqib bilan uchrashuv',
  loyiha: 'loyiha',
  loyiha_file: 'loyiha fayli',
  sklad_items: 'ombor mahsuloti',
  sklad_movements: 'ombor harakati',
  sklad_contract_lines: 'shartnoma qatori',
  sklad_sources: 'ombor manbasi',
  sklad_settings: 'ombor sozlamasi',
  training_records: "o'qitish yozuvi",
  users: 'foydalanuvchi',
  announcements: "e'lon",
  boss_targets: 'reja',
  app_releases: 'ilova versiyasi',
}
export const tableLabel = (t) => TABLES[t] || t || ''

/** Bir qatorli tavsif: "Mijoz qo'shdi: «Aziz Grand»" */
export function describe(row) {
  const meta = actionMeta(row.action)
  if (['login_failed', 'login_blocked'].includes(row.action)) {
    return row.error ? `Kirishga urindi — ${row.error.toLowerCase()}` : meta.label
  }
  if (['login', 'logout', 'password'].includes(row.action)) return meta.label
  if (row.module === 'admin' && row.entity_label) return row.entity_label
  const what = tableLabel(row.entity_type) || moduleLabel(row.module).toLowerCase()
  const name = row.entity_label ? `«${row.entity_label}»` : row.entity_id ? `#${row.entity_id}` : ''
  const verb =
    row.action === 'create' ? "qo'shdi" : row.action === 'update' ? "o'zgartirdi" : row.action === 'delete' ? "o'chirdi" : meta.label.toLowerCase()
  const head = `${what.charAt(0).toUpperCase()}${what.slice(1)} ${verb}`
  return name ? `${head}: ${name}` : head
}

/** Brauzer satridan qurilma: "Telefon ilovasi · Android" / "Sayt · Chrome, Windows" */
export function deviceText(row) {
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
  if (row.platform === 'mobile') return ['Telefon ilovasi', os].filter(Boolean).join(' · ')
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return ['Sayt', [br, os].filter(Boolean).join(', ')].filter(Boolean).join(' · ')
}

// Maydon nomlari (eng ko'p uchraydiganlari; qolgani o'z nomi bilan)
const FIELDS = {
  fullname: 'Nomi',
  name: 'Nomi',
  firstname: 'Ism',
  lastname: 'Familiya',
  username: 'Login',
  phone_number: 'Telefon',
  phone: 'Telefon',
  email: 'Email',
  address: 'Manzil',
  inn: 'INN',
  is_admin: 'Admin',
  is_blocked: 'Bloklangan',
  permissions: 'Ruxsatlar',
  password: 'Parol',
  status: 'Holat',
  title: 'Sarlavha',
  description: 'Tavsif',
  note: 'Izoh',
  more_info: 'Izoh',
  client_name: 'Mijoz',
  kp_number: 'KP raqami',
  kp_date: 'KP sanasi',
  dogovor_number: 'Shartnoma raqami',
  dogovor_date: 'Shartnoma sanasi',
  summa: 'Summa',
  amount: 'Summa',
  price: 'Narx',
  quantity: 'Miqdor',
  qty: 'Miqdor',
  outcome: 'Natija',
  reason: 'Sabab',
  deadline: 'Muddat',
  stage: 'Bosqich',
  user_id: 'Xodim (id)',
  partner_id: 'Mijoz (id)',
  admin_comment: 'Admin izohi',
  whereto: 'Qayerga',
  company_name: 'Firma',
  locationname: 'Manzil',
}
export const fieldLabel = (f) => FIELDS[f] || f

export function fmtValue(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (v === true) return 'Ha'
  if (v === false) return "Yo'q"
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) {
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${hm(d)}`
    }
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
