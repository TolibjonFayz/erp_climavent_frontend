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

    // Ro'yxatlar drawer'da o'z holatini saqlaydi — umumiy isLoading'ga tegmaymiz
    async listCalls(params) {
      return amocrmApi.listCalls(params)
    },

    async listLeads(params) {
      return amocrmApi.listLeads(params)
    },

    async getSuspicious(params) {
      return amocrmApi.getSuspicious(params)
    },

    async listExcluded() {
      return amocrmApi.listExcluded()
    },

    async excludePhone(payload) {
      return amocrmApi.excludePhone(payload)
    },

    async restorePhone(key) {
      return amocrmApi.restorePhone(key)
    },

    async getSyncStatus() {
      return amocrmApi.getSyncStatus()
    },

    async runSync(full = false) {
      return amocrmApi.runSync(full)
    },
  },
})
