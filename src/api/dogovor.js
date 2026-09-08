import apiClient from './client'

export default {
  create: (payload) => apiClient.post('dogovor/create', payload),
  import: (formData) => apiClient.post('dogovor/import', formData),
  getAll: () => apiClient.get('dogovor/all'),
  getOne: (id) => apiClient.get(`dogovor/one/${id}`),
  update: (id, payload) => apiClient.patch(`dogovor/update/${id}`, payload),
  remove: (id) => apiClient.delete(`dogovor/delete/${id}`),
}
