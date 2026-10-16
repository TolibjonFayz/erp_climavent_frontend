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
  // Yillik hisobot: davrdagi barcha qo'ng'iroqlar + oylik jamlanma
  getReport: (params) => apiClient.get('amocrm/report', { params, timeout: 120000 }),
  // Suhbat yozuvlari
  getRecordingsSummary: () => apiClient.get('amocrm/recordings/summary'),
  getRecordingUrl: (hash, download = false) =>
    apiClient.get(`amocrm/recordings/${hash}/url`, { params: { download } }),
  runHistorySync: () => apiClient.post('amocrm/recordings/history'),
  getSyncStatus: () => apiClient.get('amocrm/sync/status'),
  runSync: (full = false) => apiClient.post('amocrm/sync', { full }),
}
