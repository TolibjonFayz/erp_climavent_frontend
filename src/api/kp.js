import apiClient from './client'

export default {
  create: (payload) => apiClient.post('kp/create', payload),
  import: (formData) => apiClient.post('kp/import', formData),
  getAll: () => apiClient.get('kp/all'),
  getByUser: (userId) => apiClient.get(`kp/user/${userId}`),
  getOne: (id) => apiClient.get(`kp/one/${id}`),
  update: (id, payload) => apiClient.patch(`kp/update/${id}`, payload),
  remove: (id) => apiClient.delete(`kp/delete/${id}`),
}
