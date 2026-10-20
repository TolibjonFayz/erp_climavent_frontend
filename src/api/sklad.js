import apiClient from './client'

export default {
  getSettings: () => apiClient.get('sklad/settings'),
  updateSettings: (payload) => apiClient.patch('sklad/settings', payload),
  getReport: (period) => apiClient.get('sklad/report', { params: { period } }),
  getMovements: (params) => apiClient.get('sklad/movements', { params }),
  createMovement: (payload) => apiClient.post('sklad/movements', payload),
  removeMovement: (id) => apiClient.delete(`sklad/movements/${id}`),
  getItem: (id) => apiClient.get(`sklad/items/${id}`),
  createItem: (payload) => apiClient.post('sklad/items', payload),
  updateItem: (id, payload) => apiClient.patch(`sklad/items/${id}`, payload),
  getContracts: () => apiClient.get('sklad/contracts'),
  getSources: () => apiClient.get('sklad/sources'),
  addSource: (payload) => apiClient.post('sklad/sources', payload),
  removeSource: (id) => apiClient.delete(`sklad/sources/${id}`),
  sync: (payload = {}) => apiClient.post('sklad/sync', payload),
}
