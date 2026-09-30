import apiClient from './client'

// amoCRM statistikasi — faqat admin va boss uchun (backend AdminOrBossGuard)
export default {
  getStats: (params) => apiClient.get('amocrm/stats', { params }),
  // Son ustiga bosilganda ochiladigan ro'yxatlar
  listCalls: (params) => apiClient.get('amocrm/calls', { params }),
  listLeads: (params) => apiClient.get('amocrm/leads', { params }),
  // "Mijoz emas" raqamlar
  getSuspicious: (params) => apiClient.get('amocrm/suspicious', { params }),
  listExcluded: () => apiClient.get('amocrm/excluded-phones'),
  excludePhone: (payload) => apiClient.post('amocrm/excluded-phones', payload),
  restorePhone: (key) => apiClient.delete(`amocrm/excluded-phones/${encodeURIComponent(key)}`),
  getSyncStatus: () => apiClient.get('amocrm/sync/status'),
  runSync: (full = false) => apiClient.post('amocrm/sync', { full }),
}
