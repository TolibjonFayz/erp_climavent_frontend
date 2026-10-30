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
  // Barcha xodimlar o'qiydigan e'lonlar lentasi (bildirishnoma qo'ng'irog'i)
  getFeed: () => apiClient.get('announcements/feed'),

  // Savdo: KP, shartnomalar, menejerlar konversiyasi (period: month | quarter | year)
  getSales: (period) => apiClient.get('boss/sales', { params: { period } }),

  // Promote / demote
  setAdmin: (userId, isAdmin) => apiClient.patch(`boss/promote/${userId}`, { is_admin: isAdmin }),
}
