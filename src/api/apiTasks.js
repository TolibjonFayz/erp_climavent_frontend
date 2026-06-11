import axiosClient from './apiClient'

const tasks = {
  // Vazifa yaratish (admin biriktiradi)
  createTask(payload) {
    const url = 'tasks/create'
    return axiosClient.post(url, payload)
  },

  // Barcha vazifalar (admin)
  getAllTasks() {
    const url = 'tasks/all'
    return axiosClient.get(url)
  },

  // Bitta xodimga biriktirilgan vazifalar
  getTasksOfUser(id) {
    const url = `tasks/userall/${id}`
    return axiosClient.get(url)
  },

  // Bitta vazifa
  getOneTask(id) {
    const url = `tasks/one/${id}`
    return axiosClient.get(url)
  },

  // Vazifani to'liq tahrirlash (admin)
  updateTask(id, payload) {
    const url = `tasks/update/${id}`
    return axiosClient.patch(url, payload)
  },

  // Faqat statusni yangilash (xodim)
  updateStatus(id, payload) {
    const url = `tasks/status/${id}`
    return axiosClient.patch(url, payload)
  },

  // Vazifani o'chirish (admin)
  deleteTask(id) {
    const url = `tasks/delete/${id}`
    return axiosClient.delete(url)
  },
}

export default tasks
