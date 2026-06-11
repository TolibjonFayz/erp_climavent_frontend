import attendance from '@/api/apiAttendance'
import { defineStore } from 'pinia'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    userRecords: [], // tanlangan xodim oylik yozuvlari
    allRecords: [], // barcha xodimlar (admin overview)
    isLoading: false,
    error: null,
  }),

  actions: {
    async getUserMonth(userId, month) {
      try {
        this.isLoading = true
        this.error = null
        const res = await attendance.getUserMonth(userId, month)
        this.userRecords = Array.isArray(res) ? res : res.data || []
        return this.userRecords
      } catch (error) {
        this.error = error.message || 'Get user attendance failed'
        this.userRecords = []
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getAllMonth(month) {
      try {
        this.isLoading = true
        this.error = null
        const res = await attendance.getAllMonth(month)
        this.allRecords = Array.isArray(res) ? res : res.data || []
        return this.allRecords
      } catch (error) {
        this.error = error.message || 'Get all attendance failed'
        this.allRecords = []
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async upsert(payload) {
      try {
        this.isLoading = true
        this.error = null
        const res = await attendance.createOrUpdate(payload)
        return res.data || res
      } catch (error) {
        this.error = error.message || 'Save attendance failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteRecord(id) {
      try {
        this.isLoading = true
        this.error = null
        const res = await attendance.deleteRecord(id)
        return res
      } catch (error) {
        this.error = error.message || 'Delete attendance failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
