import { defineStore } from 'pinia'
import dogovorApi from '@/api/dogovor'
import { runRequest } from './helpers'

const normalize = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.data) return payload.data
  if (payload?.items) return payload.items
  return payload || []
}

export const useDogovorStore = defineStore('dogovor', {
  state: () => ({
    allDogovors: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async getAllDogovors() {
      const res = await runRequest(this, () => dogovorApi.getAll(), 'Get all dogovors failed')
      this.allDogovors = normalize(res)
      return res
    },

    async createDogovor(payload) {
      return runRequest(this, () => dogovorApi.create(payload), 'Create dogovor failed')
    },

    async importDogovors(file) {
      const formData = new FormData()
      formData.append('file', file)
      return runRequest(this, () => dogovorApi.import(formData), 'Import dogovor failed')
    },

    async updateDogovor(id, payload) {
      return runRequest(this, () => dogovorApi.update(id, payload), 'Update dogovor failed')
    },

    async deleteDogovor(id) {
      return runRequest(this, () => dogovorApi.remove(id), 'Delete dogovor failed')
    },
  },
})
