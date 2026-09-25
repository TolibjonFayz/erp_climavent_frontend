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

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || (error.response?.status === 403 && error.response?.data?.message === 'Akkount bloklangan')) {
      localStorage.removeItem('accesstoken')
      localStorage.removeItem('refreshtoken')
      localStorage.removeItem('userid')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
