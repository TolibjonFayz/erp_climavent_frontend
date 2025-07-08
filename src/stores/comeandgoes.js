import comeandgoes from '@/api/apiComeandGO'
import { defineStore } from 'pinia'

export const useComeAndGoesStore = defineStore('comeandgoes', {
  state: () => ({
    currentUser: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  }),
  actions: {
    async createComeAndGoes(payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoes.createComeAndGo(payload)
        this.currentUser = res.data || res
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Create Come and Go failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
