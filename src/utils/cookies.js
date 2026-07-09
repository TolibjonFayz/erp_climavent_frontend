/** Read a cookie value by name, returning `fallback` when it is not set. */
export function getCookie(name, fallback = '') {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) return decodeURIComponent(value)
  }
  return fallback
}
