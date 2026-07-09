import { defineStore } from 'pinia'
import bossApi from '@/api/boss'

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
        const res = await bossApi.getTargets(month)
        this.targets = Array.isArray(res) ? res : res.data || []
        return this.targets
      } catch (error) {
        this.error = error.message
        this.targets = []
      } finally {
        this.isLoading = false
      }
    },

    async upsertTarget(payload) {
      const res = await bossApi.upsertTarget(payload)
      return res.data || res
    },

    async deleteTarget(id) {
      return bossApi.deleteTarget(id)
    },

    async getAnnouncements() {
      try {
        this.isLoading = true
        const res = await bossApi.getAnnouncements()
        this.announcements = Array.isArray(res) ? res : res.data || []
        return this.announcements
      } catch (error) {
        this.error = error.message
        this.announcements = []
      } finally {
        this.isLoading = false
      }
    },

    async createAnnouncement(payload) {
      const res = await bossApi.createAnnouncement(payload)
      return res.data || res
    },

    async deleteAnnouncement(id) {
      return bossApi.deleteAnnouncement(id)
    },

    async setAdmin(userId, isAdmin) {
      const res = await bossApi.setAdmin(userId, isAdmin)
      return res.data || res
    },
  },
})
