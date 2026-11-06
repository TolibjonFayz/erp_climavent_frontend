// Lidlar bo'limi uchun umumiy ro'yxatlar va yordamchilar

export const LEAD_STATUSES = ['new', 'in_progress', 'won', 'lost', 'spam']
export const LEAD_SOURCES = ['telegram_group', 'telegram_comment', 'telegram_private', 'email', 'manual']

// Holat → Element Plus tag turi
export const STATUS_TAG = {
  new: 'danger',
  in_progress: 'warning',
  won: 'success',
  lost: 'info',
  spam: 'info',
}

export const SOURCE_ICON = {
  telegram_group: '💬',
  telegram_comment: '📣',
  telegram_private: '✉️',
  email: '📧',
  manual: '✍️',
}

/** Xodim to'liq ismi */
export const userName = (u) => [u?.firstname, u?.lastname].filter(Boolean).join(' ').trim() || u?.username || `#${u?.id}`

/** Lid sarlavhasi: ism → @username → telefon → email */
export const leadTitle = (l) =>
  l?.name || (l?.username ? `@${l.username}` : '') || l?.phone || l?.email || `#${l?.id}`

/** Backend manzilidan (…/api/) saytning ildiz manzili */
export const backendOrigin = () => String(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/api\/?$/, '')
