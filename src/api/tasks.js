import apiClient from './client'

export default {
  create: (payload) => apiClient.post('tasks/create', payload),
  getAll: () => apiClient.get('tasks/all'),
  getByUser: (userId) => apiClient.get(`tasks/userall/${userId}`),
  getOne: (id) => apiClient.get(`tasks/one/${id}`),
  update: (id, payload) => apiClient.patch(`tasks/update/${id}`, payload),
  updateStatus: (id, payload) => apiClient.patch(`tasks/status/${id}`, payload),
  remove: (id) => apiClient.delete(`tasks/delete/${id}`),
}
