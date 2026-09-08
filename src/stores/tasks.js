import { defineStore } from 'pinia'
import tasksApi from '@/api/tasks'
import { runRequest } from './helpers'

const normalize = (res) => res?.data || res || []

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    allTasks: [], // admin: every task
    myTasks: [], // employee: tasks assigned to them
    pendingApprovals: [], // approver: requests waiting for a decision
    approver: null, // who approves stage changes (Gulshoda)
    isLoading: false,
    error: null,
  }),

  getters: {
    // Sidebar/board uchun: rolga qarab tegishli ro'yxat
    statusCounts: (state) => (isAdmin) => {
      const list = isAdmin ? state.allTasks : state.myTasks
      return {
        todo: list.filter((t) => t.status === 'todo').length,
        in_progress: list.filter((t) => t.status === 'in_progress').length,
        done: list.filter((t) => t.status === 'done').length,
        pending: list.filter((t) => !!t.pending_status).length,
        total: list.length,
      }
    },
  },

  actions: {
    async getAllTasks() {
      const res = await runRequest(this, () => tasksApi.getAll(), 'Get all tasks failed')
      this.allTasks = normalize(res)
      return res
    },

    async getMyTasks(userId) {
      const res = await runRequest(this, () => tasksApi.getByUser(userId), 'Get my tasks failed')
      this.myTasks = normalize(res)
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

    // ─── Tasdiqlash oqimi ───
    async getApprover() {
      const res = await runRequest(this, () => tasksApi.getApprover(), 'Get approver failed')
      this.approver = res?.data || res || null
      return this.approver
    },

    async getPendingApprovals() {
      // Tasdiqlovchi bo'lmaganlar uchun backend 403 qaytaradi — bu xato emas
      try {
        const res = await tasksApi.getPendingApprovals()
        this.pendingApprovals = normalize(res)
      } catch {
        this.pendingApprovals = []
      }
      return this.pendingApprovals
    },

    async requestApproval(id, status, note) {
      return runRequest(
        this,
        () => tasksApi.requestApproval(id, { status, note }),
        'Request approval failed',
      )
    },

    async cancelApproval(id) {
      return runRequest(this, () => tasksApi.cancelApproval(id), 'Cancel approval failed')
    },

    async approveTask(id) {
      return runRequest(this, () => tasksApi.approve(id), 'Approve failed')
    },

    async rejectTask(id, reason) {
      return runRequest(this, () => tasksApi.reject(id, { reason }), 'Reject failed')
    },
  },
})
