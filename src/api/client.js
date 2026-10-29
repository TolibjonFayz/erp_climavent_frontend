import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accesstoken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Sessiya tugaganda nima qilinadi. Sayt /login sahifasiga o'tadi;
// mobil ilova (hash router, Capacitor) o'z ishlovchisini o'rnatadi.
let onUnauthorized = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function clearSession() {
  localStorage.removeItem('accesstoken')
  localStorage.removeItem('refreshtoken')
  localStorage.removeItem('userid')
}

// Access token muddati o'tsa (401) — refresh token bilan jim yangilab, so'rovni qaytaramiz.
// Bir vaqtda kelgan bir nechta 401 bitta refresh so'rovini kutadi.
let refreshing = null
function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshtoken')
  if (!refreshToken) return Promise.reject(new Error('no refresh token'))
  refreshing ??= axios
    .post(`${import.meta.env.VITE_APP_BASE_URL}users/refresh`, { refreshToken })
    .then(({ data }) => {
      localStorage.setItem('accesstoken', data.accessToken)
      localStorage.setItem('refreshtoken', data.refreshToken)
      return data.accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// Login/refresh/logout'ning o'z 401'i — yangilashga urinilmaydi
const AUTH_URL = /users\/(login|refresh|logout)$/

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status
    const config = error.config || {}
    if (status === 401 && !config._retried && !AUTH_URL.test(config.url || '')) {
      try {
        const token = await refreshTokens()
        config._retried = true
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
        return apiClient(config)
      } catch {
        // refresh ham o'tmadi — quyida sessiya yopiladi
      }
    }
    if (status === 401 || (status === 403 && error.response?.data?.message === 'Akkount bloklangan')) {
      clearSession()
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

// Chiqish: sessiya serverda ham yopiladi (refresh token boshqa ishlamaydi)
export async function logoutSession() {
  const refreshToken = localStorage.getItem('refreshtoken')
  clearSession()
  if (refreshToken) {
    try {
      await axios.post(`${import.meta.env.VITE_APP_BASE_URL}users/logout`, { refreshToken })
    } catch {
      // tarmoq xatosi chiqishga xalaqit bermasin
    }
  }
}

export default apiClient
