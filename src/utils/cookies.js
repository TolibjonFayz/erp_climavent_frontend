/** Read a cookie value by name, returning `fallback` when it is not set. */
export function getCookie(name, fallback = '') {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) return decodeURIComponent(value)
  }
  return fallback
}

export function setCookie(name, value, days = 365) {
  const date = new Date()
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`
}
