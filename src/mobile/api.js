import apiClient from '@/api/client'

// Faqat mobil ilovaga tegishli backend endpointlari
export const devicesApi = {
  register: (payload) => apiClient.post('devices/register', payload),
  unregister: (token) => apiClient.post('devices/unregister', { token }),
  test: () => apiClient.post('devices/test'),
  status: () => apiClient.get('devices/status'),
}

export const releasesApi = {
  latest: (platform = 'android') => apiClient.get('app-releases/latest', { params: { platform } }),
  list: () => apiClient.get('app-releases'),
  remove: (id) => apiClient.delete(`app-releases/${id}`),
  upload: (form, onProgress) =>
    apiClient.post('app-releases', form, {
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.min(99, Math.round((e.loaded * 100) / e.total)))
      },
    }),
}
