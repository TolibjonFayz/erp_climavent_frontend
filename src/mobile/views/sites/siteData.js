// Obyekt tashriflari (come-and-goes) bilan ishlash uchun umumiy yordamchilar

export const WHERE_OPTIONS = [
  { value: 'Zavod', labelKey: 'zavod' },
  { value: 'Klient', labelKey: 'klient' },
  { value: 'Shaxsiy', labelKey: 'shaxsiy' },
]

export const DOC_OPTIONS = [
  { value: 'KP', labelKey: 'kp' },
  { value: 'Dogovor', labelKey: 'dogovor' },
]

/** come-and-goes konteyneri → ro'yxat qatori (birinchi "ichki" yozuv — tashrif) */
export function toSiteRow(item) {
  const insides = item.comeAndGoInsides || item.comeandgoinsides || []
  const v = insides[0] || {}
  return {
    id: item.id,
    whereto: v.whereto || '',
    company: v.company_name || '',
    gone: v.when_gone || null,
    came: v.when_came || null,
    contract: v.dogovor_or_kp || '',
    contractNumber: v.dogovorkp_number || '',
    location: v.locationname || '',
    created: v.createdAt || item.createdAt || null,
    extra: Math.max(0, insides.length - 1),
  }
}

export const whereTone = (w) =>
  ({ Zavod: 'is-blue', Klient: 'is-good', Shaxsiy: 'is-warn' })[w] || ''

// Cloudinary (sayt bilan bir xil imzosiz preset)
const CLOUD_NAME = 'dne7ddv2a'
const UPLOAD_PRESET = 'erp_climavent_uploads'

export const MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/3gpp',
]
export const MAX_MEDIA_MB = 200

export const isVideoFile = (file) => String(file?.type || '').startsWith('video/')

/** URL bo'yicha rasm yoki video */
export const isImageUrl = (url) =>
  /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif)(\?|$)/i.test(String(url || '')) ||
  /\/image\/upload\//.test(String(url || ''))

/** Cloudinary'ga yuklash, onProgress(0..100) bilan */
export function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', UPLOAD_PRESET)
    data.append('folder', 'website-uploads')
    data.append('tags', 'user-upload,media')
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(res)
        else reject(new Error(res?.error?.message || `HTTP ${xhr.status}`))
      } catch (e) {
        reject(e)
      }
    }
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(data)
  })
}

/** Video uchun Cloudinary kadr-rasmi (ro'yxatda ko'rsatish uchun) */
export function videoPoster(url) {
  if (!/res\.cloudinary\.com/.test(url || '')) return ''
  return url.replace('/video/upload/', '/video/upload/so_1,w_400,c_fill/').replace(/\.\w+$/, '.jpg')
}

/** Rasm uchun kichik nusxa */
export function imageThumb(url) {
  if (!/res\.cloudinary\.com/.test(url || '')) return url
  return url.replace('/image/upload/', '/image/upload/w_400,c_fill,q_auto,f_auto/')
}
