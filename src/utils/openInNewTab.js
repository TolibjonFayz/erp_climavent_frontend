// Havolani yangi brauzer oynasida (tab) ochadi.
// Brauzer pop-up'ni bloklasa yoki mobil ilovada (Capacitor) yangi oyna bo'lmasa —
// `fallback` chaqiriladi (odatda shu oynada ochish) va false qaytadi.
export function openInNewTab(href, fallback) {
  const native = !!window.Capacitor?.isNativePlatform?.()
  let win = null
  if (!native) {
    try {
      win = window.open(href, '_blank')
    } catch {
      win = null
    }
  }
  if (win) return true
  fallback?.()
  return false
}
