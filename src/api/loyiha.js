import apiClient from './client'

export default {
  create: (payload) => apiClient.post('loyiha/create', payload),
  getAll: () => apiClient.get('loyiha/all'),
  getOne: (id) => apiClient.get(`loyiha/one/${id}`),
  update: (id, payload) => apiClient.patch(`loyiha/update/${id}`, payload),
  remove: (id) => apiClient.delete(`loyiha/delete/${id}`),
  nextNumber: () => apiClient.get('loyiha/next-number'),
  storageStatus: () => apiClient.get('loyiha/storage-status'),

  // Fayllar: section — 'archive' (o'zgarmas) yoki 'working' (tahrirlanadi)
  uploadFile: (id, section, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`loyiha/${id}/files/${section}`, formData)
  },
  fileLink: (fileId, mode = 'download') =>
    apiClient.get(`loyiha/file/${fileId}/link`, { params: { mode } }),
  updateFile: (fileId, payload) => apiClient.patch(`loyiha/file/${fileId}`, payload),
  removeFile: (fileId) => apiClient.delete(`loyiha/file/${fileId}`),
}
