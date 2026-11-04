import apiClient from './client'

export default {
  getSettings: () => apiClient.get('otgruzka/settings'),
  updateSettings: (payload) => apiClient.patch('otgruzka/settings', payload),
  sync: () => apiClient.post('otgruzka/sync', {}),
  getScript: () => apiClient.get('otgruzka/script'),
  setScript: (script_url) => apiClient.patch('otgruzka/script', { script_url }),
  testScript: () => apiClient.post('otgruzka/script/test', {}),
  list: (params) => apiClient.get('otgruzka/list', { params }),
  stats: () => apiClient.get('otgruzka/stats'),
  lines: () => apiClient.get('otgruzka/lines'),
  one: (id) => apiClient.get(`otgruzka/one/${id}`),
  create: (payload) => apiClient.post('otgruzka/create', payload),
  update: (id, payload) => apiClient.patch(`otgruzka/update/${id}`, payload),
  addPayment: (id, payload) => apiClient.post(`otgruzka/${id}/payments`, payload),
  updatePayment: (id, payload) => apiClient.patch(`otgruzka/payments/${id}`, payload),
  removePayment: (id) => apiClient.delete(`otgruzka/payments/${id}`),
  addNote: (id, payload) => apiClient.post(`otgruzka/${id}/notes`, payload),
  removeNote: (id) => apiClient.delete(`otgruzka/notes/${id}`),
}
