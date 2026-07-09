import apiClient from './client'

export default {
  login: (payload) => apiClient.post('users/login', payload),
  getOne: (id) => apiClient.get(`users/one/${id}`),
  getAll: () => apiClient.get('users/all'),
  updateProfile: (id, payload) => apiClient.patch(`users/update/${id}`, payload),
  updatePassword: (id, payload) => apiClient.patch(`users/update-password/${id}`, payload),
}
