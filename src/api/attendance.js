import apiClient from './client'

const withMonth = (path, month) => (month ? `${path}?month=${month}` : path)

export default {
  upsert: (payload) => apiClient.post('attendance/create', payload),
  getUserMonth: (userId, month) => apiClient.get(withMonth(`attendance/user/${userId}`, month)),
  getAllMonth: (month) => apiClient.get(withMonth('attendance/all', month)),
  update: (id, payload) => apiClient.patch(`attendance/update/${id}`, payload),
  remove: (id) => apiClient.delete(`attendance/delete/${id}`),

  // Hikvision yuz terminallari (kirish/chiqish kamerasi)
  getCameraUserMonth: (userId, month) =>
    apiClient.get(withMonth(`attendance/hik/daily/user/${userId}`, month)),
  getCameraEmployeeMonth: (employeeNo, month) =>
    apiClient.get(withMonth(`attendance/hik/daily/employee/${employeeNo}`, month)),
  getCameraOfficeDays: (month) => apiClient.get(withMonth('attendance/hik/office-days', month)),
  getCameraEmployees: () => apiClient.get('attendance/hik/employees'),
  linkCameraEmployee: (employeeNo, userId) =>
    apiClient.patch(`attendance/hik/employees/${employeeNo}`, { user_id: userId }),
  getCameraDevices: () => apiClient.get('attendance/hik/devices'),
}
