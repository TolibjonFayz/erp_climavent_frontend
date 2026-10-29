import apiClient from './client'

// Xodimni o'qitish: yo'riqnoma va test (savollar/baholash serverda)
export default {
  status: (module) => apiClient.get(`training/${module}/status`),
  tutorialDone: (module, payload) => apiClient.post(`training/${module}/tutorial-done`, payload),
  startQuiz: (module, lang) => apiClient.post(`training/${module}/quiz/start`, null, { params: { lang } }),
  submitQuiz: (module, payload) => apiClient.post(`training/${module}/quiz/submit`, payload),
  report: (module) => apiClient.get(`training/${module}/report`),
  attempt: (module, id, lang) => apiClient.get(`training/${module}/attempts/${id}`, { params: { lang } }),
}
