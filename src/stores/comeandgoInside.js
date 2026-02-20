import comeandgoInside from '@/api/apiComeandGoInside'
import { defineStore } from 'pinia'

export const useComeAndGoInsideStore = defineStore('comeandgoInside', {
  state: () => ({
    isLoading: false,
    error: null,
    allComeAndGoInsides: [],
    comeandgoInsideById: null,
  }),
  actions: {
    async createComeAndGoInside(payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoInside.createComeAndGoInside(payload)
        return res
      } catch (error) {
        this.error = error.message || 'Create Come and Go Inside failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getComeAndGoInsideById(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoInside.getComeAndGoInsideById(id)
        this.comeandgoInsideById = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get come and go inside by id failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getAllComeAndGoInside() {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoInside.getAllComeAndGoInside()
        this.allComeAndGoInsides = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get all come and go insides failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getComeAndGoInsideById(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoInside.getComeAndGoInsideById(id)
        this.comeandgoInsideById = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get come and go inside by id failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateComeAndGoInsideById(payload, id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoInside.updateComeAndGoInsideById(payload, id)
        return res
      } catch (error) {
        this.error = error.message || 'Update come and go inside by id failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
