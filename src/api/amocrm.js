import apiClient from './client'

// amoCRM statistikasi — faqat admin va boss uchun (backend AdminOrBossGuard)
export default {
  getStats: (params) => apiClient.get('amocrm/stats', { params }),
  // Son ustiga bosilganda ochiladigan ro'yxatlar
  listCalls: (params) => apiClient.get('amocrm/calls', { params }),
  listLeads: (params) => apiClient.get('amocrm/leads', { params }),
  getSyncStatus: () => apiClient.get('amocrm/sync/status'),
  runSync: (full = false) => apiClient.post('amocrm/sync', { full }),
}
