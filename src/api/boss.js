import apiClient from './client'

export default {
  // Targets
  upsertTarget: (payload) => apiClient.post('boss/targets', payload),
  getTargets: (month) => apiClient.get(month ? `boss/targets?month=${month}` : 'boss/targets'),
  deleteTarget: (id) => apiClient.delete(`boss/targets/${id}`),

  // Announcements
  createAnnouncement: (payload) => apiClient.post('boss/announcements', payload),
  getAnnouncements: () => apiClient.get('boss/announcements'),
  deleteAnnouncement: (id) => apiClient.delete(`boss/announcements/${id}`),

  // Promote / demote
  setAdmin: (userId, isAdmin) => apiClient.patch(`boss/promote/${userId}`, { is_admin: isAdmin }),
}
