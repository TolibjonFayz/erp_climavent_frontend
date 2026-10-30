import apiClient from './client'

export default {
  list: () => apiClient.get('competitors'),
  create: (payload) => apiClient.post('competitors', payload),
  update: (id, payload) => apiClient.patch(`competitors/${id}`, payload),
  remove: (id) => apiClient.delete(`competitors/${id}`),

  // Uchrashuvlar: params — { competitor_id?, partner_id? }
  encounters: (params) => apiClient.get('competitors/encounters', { params }),
  createEncounter: (payload) => apiClient.post('competitors/encounters', payload),
  updateEncounter: (id, payload) => apiClient.patch(`competitors/encounters/${id}`, payload),
  removeEncounter: (id) => apiClient.delete(`competitors/encounters/${id}`),
}
