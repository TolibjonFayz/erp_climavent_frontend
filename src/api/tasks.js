import apiClient from './client'

export default {
  create: (payload) => apiClient.post('tasks/create', payload),
  getAll: () => apiClient.get('tasks/all'),
  getByUser: (userId) => apiClient.get(`tasks/userall/${userId}`),
  getOne: (id) => apiClient.get(`tasks/one/${id}`),
  update: (id, payload) => apiClient.patch(`tasks/update/${id}`, payload),
  updateStatus: (id, payload) => apiClient.patch(`tasks/status/${id}`, payload),
  remove: (id) => apiClient.delete(`tasks/delete/${id}`),

  // Bosqichni tasdiqlash oqimi
  getApprover: () => apiClient.get('tasks/approver'),
  getPendingApprovals: () => apiClient.get('tasks/pending-approvals'),
  requestApproval: (id, payload) => apiClient.patch(`tasks/request-approval/${id}`, payload),
  cancelApproval: (id) => apiClient.patch(`tasks/cancel-approval/${id}`),
  approve: (id) => apiClient.patch(`tasks/approve/${id}`),
  reject: (id, payload) => apiClient.patch(`tasks/reject/${id}`, payload),
}
