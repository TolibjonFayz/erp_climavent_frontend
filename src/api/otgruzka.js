import apiClient from './client'

export default {
  getSettings: () => apiClient.get('otgruzka/settings'),
  updateSettings: (payload) => apiClient.patch('otgruzka/settings', payload),
  sync: () => apiClient.post('otgruzka/sync', {}),
  getScript: () => apiClient.get('otgruzka/script'),
  setScript: (script_url) => apiClient.patch('otgruzka/script', { script_url }),
  testScript: () => apiClient.post('otgruzka/script/test', {}),
  list: (params) => apiClient.get('otgruzka/list', { params }),
  stats: () => apiClient.get('otgruzka/stats'),
  lines: () => apiClient.get('otgruzka/lines'),
  one: (id) => apiClient.get(`otgruzka/one/${id}`),
  stock: (id) => apiClient.get(`otgruzka/one/${id}/stock`),
  readiness: () => apiClient.get('otgruzka/readiness'),
  managers: () => apiClient.get('otgruzka/managers'),
  create: (payload) => apiClient.post('otgruzka/create', payload),
  update: (id, payload) => apiClient.patch(`otgruzka/update/${id}`, payload),
  addPayment: (id, payload) => apiClient.post(`otgruzka/${id}/payments`, payload),
  updatePayment: (id, payload) => apiClient.patch(`otgruzka/payments/${id}`, payload),
  removePayment: (id) => apiClient.delete(`otgruzka/payments/${id}`),
  addNote: (id, payload) => apiClient.post(`otgruzka/${id}/notes`, payload),
  removeNote: (id) => apiClient.delete(`otgruzka/notes/${id}`),
  // Didox: schyot-faktura fayllari (Cloudflare R2)
  addDidox: (id, file, meta = {}, onUploadProgress) => {
    const fd = new FormData()
    fd.append('file', file)
    for (const [k, v] of Object.entries(meta)) if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
    return apiClient.post(`otgruzka/${id}/didox`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0, onUploadProgress })
  },
  // Shartnoma bo'limidagi Didox PDF — bog'langan otgruzka kartasiga shartnoma fayli bo'lib
  addDidoxByDogovor: (dogovorId, file, meta = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    for (const [k, v] of Object.entries(meta)) if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
    return apiClient.post(`otgruzka/by-dogovor/${dogovorId}/didox`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 })
  },
  updateDidox: (fileId, payload) => apiClient.patch(`otgruzka/didox/${fileId}`, payload),
  removeDidox: (fileId) => apiClient.delete(`otgruzka/didox/${fileId}`),
  // Yuklashdan oldin dublikatni tekshirish (raqam / sana / Didox ID) — butun bazada
  checkDidox: (id, params) => apiClient.get(`otgruzka/${id}/didox/check`, { params }),
  // Fayl tarkibi (PDF'ni qayta o'qish uchun)
  didoxFile: (fileId) => apiClient.get(`otgruzka/didox/${fileId}/file`, { responseType: 'arraybuffer', timeout: 0 }),
  didoxLink: (fileId, mode = 'inline') => apiClient.get(`otgruzka/didox/${fileId}/link`, { params: { mode } }),
  // Ombor tekshiruvi (yangi shartnomalar)
  skladChecks: () => apiClient.get('otgruzka/sklad-checks'),
  skladChecksCount: () => apiClient.get('otgruzka/sklad-checks/count'),
  skladCheck: (id, payload) => apiClient.post(`otgruzka/${id}/sklad-check`, payload),
}
