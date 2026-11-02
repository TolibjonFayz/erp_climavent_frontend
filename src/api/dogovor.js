import apiClient from './client'

export default {
  create: (payload) => apiClient.post('dogovor/create', payload),
  import: (formData) => apiClient.post('dogovor/import', formData),
  getAll: () => apiClient.get('dogovor/all'),
  // Sahifa: { rows, total, stats } — filtrlar va bo'lak serverda
  getPage: (params) => apiClient.get('dogovor/page', { params }),
  // Excel eksport: filtrga mos hammasi
  exportList: (params) => apiClient.get('dogovor/export', { params }),
  // Umumiy qidiruv (Ctrl+K)
  search: (q) => apiClient.get('dogovor/search', { params: { q } }),
  getOne: (id) => apiClient.get(`dogovor/one/${id}`),
  update: (id, payload) => apiClient.patch(`dogovor/update/${id}`, payload),
  remove: (id) => apiClient.delete(`dogovor/delete/${id}`),
}
