import { defineStore } from 'pinia'
import tasksApi from '@/api/tasks'
import { runRequest } from './helpers'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    allTasks: [], // admin: every task
    myTasks: [], // employee: tasks assigned to them
    isLoading: false,
    error: null,
  }),
  actions: {
    async getAllTasks() {
      const res = await runRequest(this, () => tasksApi.getAll(), 'Get all tasks failed')
      this.allTasks = res.data || res
      return res
    },

    async getMyTasks(userId) {
      const res = await runRequest(this, () => tasksApi.getByUser(userId), 'Get my tasks failed')
      this.myTasks = res.data || res
      return res
    },

    async createTask(payload) {
      return runRequest(this, () => tasksApi.create(payload), 'Create task failed')
    },

    async updateTask(id, payload) {
      return runRequest(this, () => tasksApi.update(id, payload), 'Update task failed')
    },

    async updateStatus(id, status) {
      return runRequest(this, () => tasksApi.updateStatus(id, { status }), 'Update status failed')
    },

    async deleteTask(id) {
      return runRequest(this, () => tasksApi.remove(id), 'Delete task failed')
    },
  },
})
