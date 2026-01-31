import comeandgoes from '@/api/apiComeandGO'
import { defineStore } from 'pinia'

export const useComeAndGoesStore = defineStore('comeandgoes', {
  state: () => ({
    currentUser: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    allComeAndGoesofUser: [],
    comeandgobyid: null,
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

    async getComeAndGoesOfUser(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoes.getAllComeAndGoOfUserById(id)
        // Xavfsiz: agar array bo'lmasa, bo'sh array qo'y
        this.allComeAndGoesofUser = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : []
        return res
      } catch (error) {
        this.error = error.message || 'Get Come and Go of user failed'
        this.allComeAndGoesofUser = [] // Xato vaqtida bo'sh array
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getComeAndGoById(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoes.getComeAndGoById(id)
        // Bitta object - direct store qil
        this.allComeAndGoesofUser = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Get Come and Go of user failed'
        this.allComeAndGoesofUser = null // Xato vaqtida null
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateComeAndGoById(payload, id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await comeandgoes.updateComeAndGoById(payload, id)
        return res
      } catch (error) {
        this.error = error.message || 'Update come and go by id is failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
