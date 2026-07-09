import { defineStore } from 'pinia'
import partnersApi from '@/api/partners'
import { runRequest } from './helpers'

export const usePartnersStore = defineStore('partners', {
  state: () => ({
    isLoading: false,
    error: null,
    allPartners: [],
    allPartnersofUser: [],
    partnerbyid: null,
  }),
  actions: {
    async createPartner(payload) {
      return runRequest(this, () => partnersApi.create(payload), 'Create partner failed')
    },

    async getAllPartners() {
      const res = await runRequest(this, () => partnersApi.getAll(), 'Get all partners failed')
      this.allPartners = res.data || res
      return res
    },

    async getAllPartnersOfUser(id) {
      const res = await runRequest(
        this,
        () => partnersApi.getByUser(id),
        'Get partners of user failed',
      )
      this.allPartnersofUser = res.data || res
      return res
    },

    async getOnePartner(id) {
      const res = await runRequest(this, () => partnersApi.getOne(id), 'Get partner failed')
      this.partnerbyid = res.data || res
      return res
    },

    async updateOnePartner(payload, id) {
      return runRequest(this, () => partnersApi.update(id, payload), 'Update partner failed')
    },

    async deleteOnePartner(id) {
      return runRequest(this, () => partnersApi.remove(id), 'Delete partner failed')
    },
  },
})
