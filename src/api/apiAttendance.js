import axiosClient from './apiClient'

const attendance = {
  // Davomat kiritish/yangilash (admin)
  createOrUpdate(payload) {
    const url = 'attendance/create'
    return axiosClient.post(url, payload)
  },

  // Bitta xodim oylik davomati
  getUserMonth(userId, month) {
    const url = `attendance/user/${userId}${month ? `?month=${month}` : ''}`
    return axiosClient.get(url)
  },

  // Barcha xodimlar oylik davomati (admin)
  getAllMonth(month) {
    const url = `attendance/all${month ? `?month=${month}` : ''}`
    return axiosClient.get(url)
  },

  updateRecord(id, payload) {
    const url = `attendance/update/${id}`
    return axiosClient.patch(url, payload)
  },

  deleteRecord(id) {
    const url = `attendance/delete/${id}`
    return axiosClient.delete(url)
  },
}

export default attendance
