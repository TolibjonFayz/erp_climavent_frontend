import { defineStore } from 'pinia'
import checkInOutInsideApi from '@/api/checkInOutInside'
import { runRequest } from './helpers'

export const useComeAndGoInsideStore = defineStore('comeandgoInside', {
  state: () => ({
    isLoading: false,
    error: null,
    allComeAndGoInsides: [],
    comeandgoInsideById: null,
  }),
  actions: {
    async createComeAndGoInside(payload) {
      return runRequest(this, () => checkInOutInsideApi.create(payload), 'Create failed')
    },

    async getAllComeAndGoInside() {
      const res = await runRequest(this, () => checkInOutInsideApi.getAll(), 'Get all failed')
      this.allComeAndGoInsides = res.data || res
      return res
    },

    async getComeAndGoInsideById(id) {
      const res = await runRequest(this, () => checkInOutInsideApi.getOne(id), 'Get one failed')
      this.comeandgoInsideById = res.data || res
      return res
    },

    async updateComeAndGoInsideById(payload, id) {
      return runRequest(this, () => checkInOutInsideApi.update(id, payload), 'Update failed')
    },
  },
})
