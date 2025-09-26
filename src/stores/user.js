import { defineStore } from 'pinia'
import users from '@/api/apiUsers'

export const useUsersStore = defineStore('users', {
  state: () => ({
    currentUser: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  }),
  actions: {
    async loginUser(payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await users.loginUser(payload)
        this.currentUser = res.data || res
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Login failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getUserInfo(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await users.getUserInfo(id)
        this.currentUser = res.data || res
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Failed to fetch user'
        this.isAuthenticated = false
        this.currentUser = null
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateUser(id, payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await users.updateUserShaxsiyInfo(id, payload)
        this.currentUser = res.data || res
        return res
      } catch (error) {
        this.error = error.message || 'Update failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
