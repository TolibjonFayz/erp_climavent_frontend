import { defineStore } from 'pinia'
import checkInOutApi from '@/api/checkInOut'
import { runRequest } from './helpers'

export const useComeAndGoesStore = defineStore('comeandgoes', {
  state: () => ({
    isLoading: false,
    error: null,
    allComeAndGoesofUser: [],
  }),
  actions: {
    async createComeAndGoes(payload) {
      return runRequest(this, () => checkInOutApi.create(payload), 'Create check-in/out failed')
    },

    async getComeAndGoesOfUser(id) {
      try {
        const res = await runRequest(
          this,
          () => checkInOutApi.getByUser(id),
          'Get check-in/out of user failed',
        )
        this.allComeAndGoesofUser = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : []
        return res
      } catch (error) {
        this.allComeAndGoesofUser = []
        throw error
      }
    },

    async getComeAndGoById(id) {
      const res = await runRequest(this, () => checkInOutApi.getOne(id), 'Get check-in/out failed')
      this.allComeAndGoesofUser = res.data || res
      return res
    },

    async updateComeAndGoById(payload, id) {
      return runRequest(this, () => checkInOutApi.update(id, payload), 'Update check-in/out failed')
    },
  },
})
