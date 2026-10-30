import apiClient from './client'

export default {
  create: (payload) => apiClient.post('come-and-goes/create', payload),
  getByUser: (userId) => apiClient.get(`come-and-goes/user/${userId}`),
  getOne: (id) => apiClient.get(`come-and-goes/one/${id}`),
  update: (id, payload) => apiClient.patch(`come-and-goes/update/${id}`, payload),
  // Obyekt tashriflari va videolari bilan birga o'chadi
  remove: (id) => apiClient.delete(`come-and-goes/delete/${id}`),
}
