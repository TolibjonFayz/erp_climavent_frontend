import { defineStore } from 'pinia'
import amocrmApi from '@/api/amocrm'
import { runRequest } from './helpers'

export const useAmocrmStore = defineStore('amocrm', {
  state: () => ({
    stats: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async getStats(params) {
      return runRequest(this, async () => {
        this.stats = await amocrmApi.getStats(params)
        return this.stats
      })
    },

    async getSyncStatus() {
      return amocrmApi.getSyncStatus()
    },

    async runSync(full = false) {
      return amocrmApi.runSync(full)
    },
  },
})
