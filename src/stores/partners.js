import partners from '@/api/apiPartners'
import { defineStore } from 'pinia'

export const usePartnersStore = defineStore('partners', {
  state: () => ({
    currentUser: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    allPartners: [],
    allPartnersofUser: [],
    partnerbyid: null,
  }),
  actions: {
    async createPartner(payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.createPartner(payload)
        this.currentUser = res.data || res
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Create Partner failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getAllPartners() {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.getAllPartners()
        this.allPartners = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get all partners failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getAllPartnersOfUser(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.getALLPartnersOfAUser(id)
        this.allPartnersofUser = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get all partners of user failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getOnePartner(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.getOnePartner(id)
        this.partnerbyid = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get partner by id failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateOnePartner(payload, id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.updateOnePartner(id, payload)
        return res
      } catch (error) {
        this.error = error.message || 'Update partner by id is failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteOnePartner(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await partners.deleteOnePartner(id)
        return res
      } catch (error) {
        this.error = error.message || 'Delete partner by id failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
