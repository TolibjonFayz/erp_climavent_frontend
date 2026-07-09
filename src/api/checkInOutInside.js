import apiClient from './client'

export default {
  create: (payload) => apiClient.post('come-and-go-inside/create', payload),
  getAll: () => apiClient.get('come-and-go-inside/all'),
  getOne: (id) => apiClient.get(`come-and-go-inside/one/${id}`),
  update: (id, payload) => apiClient.patch(`come-and-go-inside/update/${id}`, payload),
}
