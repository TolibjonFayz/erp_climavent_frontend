import { defineStore } from 'pinia'
import loyihaApi from '@/api/loyiha'
import { runRequest } from './helpers'

const normalize = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.data) return payload.data
  return payload || []
}

export const useLoyihaStore = defineStore('loyiha', {
  state: () => ({
    allLoyihas: [],
    storageReady: true,
    isLoading: false,
    error: null,
  }),
  actions: {
    async getAllLoyihas() {
      const res = await runRequest(this, () => loyihaApi.getAll(), 'Get all loyihas failed')
      this.allLoyihas = normalize(res)
      return res
    },

    async checkStorage() {
      try {
        const res = await loyihaApi.storageStatus()
        this.storageReady = !!(res?.ready ?? res?.data?.ready)
      } catch {
        this.storageReady = false
      }
      return this.storageReady
    },

    async nextNumber() {
      const res = await loyihaApi.nextNumber()
      return res?.next ?? res?.data?.next ?? 1
    },

    async createLoyiha(payload) {
      return runRequest(this, () => loyihaApi.create(payload), 'Create loyiha failed')
    },

    async updateLoyiha(id, payload) {
      return runRequest(this, () => loyihaApi.update(id, payload), 'Update loyiha failed')
    },

    async deleteLoyiha(id) {
      return runRequest(this, () => loyihaApi.remove(id), 'Delete loyiha failed')
    },

    // ─── Fayllar ───
    async uploadFile(id, section, file) {
      return runRequest(this, () => loyihaApi.uploadFile(id, section, file), 'Upload failed')
    },

    async getFileLink(fileId, mode) {
      const res = await loyihaApi.fileLink(fileId, mode)
      return res?.url ?? res?.data?.url
    },

    async updateFile(fileId, payload) {
      return runRequest(this, () => loyihaApi.updateFile(fileId, payload), 'Update file failed')
    },

    async deleteFile(fileId) {
      return runRequest(this, () => loyihaApi.removeFile(fileId), 'Delete file failed')
    },
  },
})
