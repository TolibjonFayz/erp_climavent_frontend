import apiClient from './client'

const withMonth = (path, month) => (month ? `${path}?month=${month}` : path)

export default {
  upsert: (payload) => apiClient.post('attendance/create', payload),
  getUserMonth: (userId, month) => apiClient.get(withMonth(`attendance/user/${userId}`, month)),
  getAllMonth: (month) => apiClient.get(withMonth('attendance/all', month)),
  update: (id, payload) => apiClient.patch(`attendance/update/${id}`, payload),
  remove: (id) => apiClient.delete(`attendance/delete/${id}`),
}
