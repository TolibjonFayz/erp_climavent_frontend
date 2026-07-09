import { defineStore } from 'pinia'
import videosApi from '@/api/videos'
import { runRequest } from './helpers'

export const useVideosStore = defineStore('videos', {
  state: () => ({
    isLoading: false,
    error: null,
  }),
  actions: {
    async createVideo(payload) {
      return runRequest(this, () => videosApi.create(payload), 'Creating video failed')
    },

    async getVideosOfAObyekt(id) {
      return runRequest(this, () => videosApi.getBySite(id), 'Getting videos failed')
    },
  },
})
