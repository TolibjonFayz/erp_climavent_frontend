// So'rov xatosidan foydalanuvchiga ko'rsatiladigan HAQIQIY sababni chiqaradi.
// Backend xabari (matn yoki ValidationPipe massivi) bo'lsa — o'shani,
// server javob bermasa — tarmoq/vaqt sababini, aks holda fallback'ni qaytaradi.
import i18n from '@/i18n'

const t = (key, params) => i18n.global.t(key, params)

export function errorText(error, fallback = '') {
  const base = fallback || t('xatolikYuzBerdi')
  if (!error || error === 'cancel' || error === 'close') return base

  const res = error.response
  if (res) {
    const msg = res.data?.message
    const text = Array.isArray(msg) ? msg.filter(Boolean).join('; ') : msg
    // "Internal server error" foydalanuvchiga hech narsa demaydi — status bilan fallback
    if (text && typeof text === 'string' && !/^internal server error$/i.test(text.trim()))
      return text
    return res.status ? `${base} (HTTP ${res.status})` : base
  }

  if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) return t('errTimeout')
  if (error.request || error.message === 'Network Error') return t('errNetwork')
  return error.message ? `${base}: ${error.message}` : base
}
