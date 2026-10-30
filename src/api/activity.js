import apiClient from './client'

export default {
  // params — { user_id?, module?, action? ("create,update"), ok?: 'false', from?, to?, search?, limit?, offset? }
  list: (params) => apiClient.get('activity', { params }),
  userSummary: (id) => apiClient.get(`activity/user/${id}/summary`),
}
