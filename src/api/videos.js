import apiClient from './client'

export default {
  create: (payload) => apiClient.post('location-videos/create', payload),
  getBySite: (siteId) => apiClient.get(`location-videos/one/${siteId}`),
}
