import tasks from '@/api/apiTasks'
import { defineStore } from 'pinia'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    allTasks: [], // admin: barcha vazifalar
    myTasks: [], // xodim: o'ziga biriktirilgan vazifalar
    isLoading: false,
    error: null,
  }),

  actions: {
    // Admin: barcha vazifalar
    async getAllTasks() {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.getAllTasks()
        this.allTasks = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get all tasks failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Xodim: o'ziga biriktirilgan vazifalar
    async getMyTasks(userId) {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.getTasksOfUser(userId)
        this.myTasks = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get my tasks failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createTask(payload) {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.createTask(payload)
        return res
      } catch (error) {
        this.error = error.message || 'Create task failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateTask(id, payload) {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.updateTask(id, payload)
        return res
      } catch (error) {
        this.error = error.message || 'Update task failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateStatus(id, status) {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.updateStatus(id, { status })
        return res
      } catch (error) {
        this.error = error.message || 'Update status failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteTask(id) {
      try {
        this.isLoading = true
        this.error = null
        const res = await tasks.deleteTask(id)
        return res
      } catch (error) {
        this.error = error.message || 'Delete task failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
