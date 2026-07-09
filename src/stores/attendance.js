import { defineStore } from 'pinia'
import attendanceApi from '@/api/attendance'
import { runRequest } from './helpers'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    userRecords: [], // selected employee's monthly records
    allRecords: [], // every employee (admin overview)
    isLoading: false,
    error: null,
  }),
  actions: {
    async getUserMonth(userId, month) {
      try {
        const res = await runRequest(
          this,
          () => attendanceApi.getUserMonth(userId, month),
          'Get user attendance failed',
        )
        this.userRecords = Array.isArray(res) ? res : res.data || []
        return this.userRecords
      } catch (error) {
        this.userRecords = []
        throw error
      }
    },

    async getAllMonth(month) {
      try {
        const res = await runRequest(
          this,
          () => attendanceApi.getAllMonth(month),
          'Get all attendance failed',
        )
        this.allRecords = Array.isArray(res) ? res : res.data || []
        return this.allRecords
      } catch (error) {
        this.allRecords = []
        throw error
      }
    },

    async upsert(payload) {
      const res = await runRequest(this, () => attendanceApi.upsert(payload), 'Save attendance failed')
      return res.data || res
    },

    async deleteRecord(id) {
      return runRequest(this, () => attendanceApi.remove(id), 'Delete attendance failed')
    },
  },
})
