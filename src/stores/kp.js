import { defineStore } from 'pinia'
import kpApi from '@/api/kp'
import { runRequest } from './helpers'

const normalizeKps = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.data) return payload.data
  if (payload?.items) return payload.items
  return payload || []
}

export const useKPsStore = defineStore('kps', {
  state: () => ({
    allKPs: [],
    myKPs: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async getAllKPs() {
      const res = await runRequest(this, () => kpApi.getAll(), 'Get all kps failed')
      this.allKPs = normalizeKps(res)
      return res
    },

    async getMyKPs(userId) {
      const res = await runRequest(this, () => kpApi.getByUser(userId), 'Get my kps failed')
      this.myKPs = normalizeKps(res)
      return res
    },

    async createKP(payload) {
      return runRequest(this, () => kpApi.create(payload), 'Create kp failed')
    },

    async importKPs(file) {
      const formData = new FormData()
      formData.append('file', file)
      return runRequest(this, () => kpApi.import(formData), 'Import kp failed')
    },

    async updateKP(id, payload) {
      return runRequest(this, () => kpApi.update(id, payload), 'Update kp failed')
    },

    async deleteKP(id) {
      return runRequest(this, () => kpApi.remove(id), 'Delete kp failed')
    },
  },
})
