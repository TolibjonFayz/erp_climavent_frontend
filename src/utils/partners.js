/** snake_case / lower text -> "Title Case" (used for republic/region/district names). */
export function formatLocationName(text) {
  if (!text) return ''
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Element Plus tag type for a customer's legal form. */
export function partnerTypeTag(mijozturi) {
  return mijozturi === 'Yuridik shaxs' ? 'success' : 'warning'
}

const PARTNER_TYPE_LABELS = {
  doimiymijoz: 'Doimiy mijoz',
  montajnik: 'Montajnik',
  quruvchi: 'Quruvchi',
  dokonchitadbirkor: "Do'konchi tadbirkor",
  proyektinstitut: 'Proyekt institut',
  tenderfirmalar: 'Tender firmasi',
  uks: 'UKS tashkiloti',
  boshqa: 'Boshqa',
}

/** Human-readable label for a partner_type key. */
export function partnerTypeLabel(type) {
  return PARTNER_TYPE_LABELS[type] || type
}
