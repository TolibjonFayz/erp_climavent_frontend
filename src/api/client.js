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
  (error) => Promise.reject(error),
)

export default apiClient
