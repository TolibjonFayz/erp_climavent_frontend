import boss from '@/api/apiBoss'
import { defineStore } from 'pinia'

export const useBossStore = defineStore('boss', {
  state: () => ({
    targets: [],
    announcements: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    async getTargets(month) {
      try {
        this.isLoading = true
        const res = await boss.getTargets(month)
        this.targets = Array.isArray(res) ? res : res.data || []
        return this.targets
      } catch (error) {
        this.error = error.message
        this.targets = []
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },

    async upsertTarget(payload) {
      const res = await boss.upsertTarget(payload)
      return res.data || res
    },

    async deleteTarget(id) {
      return boss.deleteTarget(id)
    },

    async getAnnouncements() {
      try {
        this.isLoading = true
        const res = await boss.getAnnouncements()
        this.announcements = Array.isArray(res) ? res : res.data || []
        return this.announcements
      } catch (error) {
        this.error = error.message
        this.announcements = []
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },

    async createAnnouncement(payload) {
      const res = await boss.createAnnouncement(payload)
      return res.data || res
    },

    async deleteAnnouncement(id) {
      return boss.deleteAnnouncement(id)
    },

    async setAdmin(userId, isAdmin) {
      const res = await boss.setAdmin(userId, isAdmin)
      return res.data || res
    },
  },
})
