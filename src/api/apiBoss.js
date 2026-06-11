import axiosClient from './apiClient'

const boss = {
  // ─── Targets ───
  upsertTarget(payload) {
    return axiosClient.post('boss/targets', payload)
  },
  getTargets(month) {
    return axiosClient.get(`boss/targets${month ? `?month=${month}` : ''}`)
  },
  deleteTarget(id) {
    return axiosClient.delete(`boss/targets/${id}`)
  },

  // ─── Announcements ───
  createAnnouncement(payload) {
    return axiosClient.post('boss/announcements', payload)
  },
  getAnnouncements() {
    return axiosClient.get('boss/announcements')
  },
  deleteAnnouncement(id) {
    return axiosClient.delete(`boss/announcements/${id}`)
  },

  // ─── Promote / demote ───
  setAdmin(userId, is_admin) {
    return axiosClient.patch(`boss/promote/${userId}`, { is_admin })
  },
}

export default boss
