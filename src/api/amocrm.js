import apiClient from './client'

// amoCRM statistikasi — faqat admin va boss uchun (backend AdminOrBossGuard)
export default {
  getStats: (params) => apiClient.get('amocrm/stats', { params }),
  getSyncStatus: () => apiClient.get('amocrm/sync/status'),
  runSync: (full = false) => apiClient.post('amocrm/sync', { full }),
}
