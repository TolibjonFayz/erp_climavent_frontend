import { defineStore } from 'pinia'
import usersApi from '@/api/users'
import { runRequest } from './helpers'

export const useUsersStore = defineStore('users', {
  state: () => ({
    currentUser: null,
    allUsers: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async loginUser(payload) {
      const res = await runRequest(this, () => usersApi.login(payload), 'Login failed')
      this.currentUser = res.data || res
      return res
    },

    async getUserInfo(id) {
      try {
        const res = await runRequest(this, () => usersApi.getOne(id), 'Failed to fetch user')
        this.currentUser = res.data || res
        return res
      } catch (error) {
        this.currentUser = null
        throw error
      }
    },

    async getAllUsers() {
      const res = await runRequest(this, () => usersApi.getAll(), 'Failed to fetch users')
      this.allUsers = res.data || res
      return res
    },

    // Admin yangi xodim qo'shadi — joriy sessiya (currentUser, tokenlar) o'zgarmaydi
    async createUser(payload) {
      const res = await runRequest(this, () => usersApi.register(payload), 'Create failed')
      const user = res.user || res.data?.user
      if (user) this.allUsers = [...this.allUsers, user]
      return user
    },

    async updateUser(id, payload) {
      const res = await runRequest(this, () => usersApi.updateProfile(id, payload), 'Update failed')
      // Only update currentUser if they updated their own profile
      if (this.currentUser && Number(this.currentUser.id) === Number(id)) {
        this.currentUser = res.data || res
      }
      return res
    },

    async updateUserPassword(id, payload) {
      const res = await runRequest(
        this,
        () => usersApi.updatePassword(id, payload),
        'Update failed',
      )
      this.currentUser = res.data || res
      return res
    },
  },
})
