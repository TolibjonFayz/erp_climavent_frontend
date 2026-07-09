import apiClient from './client'

export default {
  create: (payload) => apiClient.post('partners/create', payload),
  getAll: () => apiClient.get('partners/all'),
  getByUser: (userId) => apiClient.get(`partners/userall/${userId}`),
  getOne: (id) => apiClient.get(`partners/one/${id}`),
  update: (id, payload) => apiClient.patch(`partners/update/${id}`, payload),
  remove: (id) => apiClient.delete(`partners/delete/${id}`),
}
