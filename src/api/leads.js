import apiClient from './client'

export default {
  // params: { q, source, status, manager_id, page, limit } → { items, total, counts }
  list: (params) => apiClient.get('leads', { params }),
  one: (id) => apiClient.get(`leads/${id}`),
  create: (payload) => apiClient.post('leads', payload),
  update: (id, payload) => apiClient.patch(`leads/${id}`, payload),
  remove: (id) => apiClient.delete(`leads/${id}`),

  // Admin: Telegram bot holati va webhook'ni ulash
  telegramStatus: () => apiClient.get('leads/telegram/status'),
  telegramSetWebhook: (base_url) => apiClient.post('leads/telegram/set-webhook', { base_url }),
}
