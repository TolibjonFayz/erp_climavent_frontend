import videos from '@/api/apiVideos'
import { defineStore } from 'pinia'

export const useVideosStore = defineStore('videos', {
  state: () => ({
    isLoading: false,
    error: null,
    isAuthenticated: false,
  }),
  actions: {
    async createVideo(payload) {
      try {
        this.isLoading = true
        this.error = null
        let res = await videos.createVideo(payload)
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Creating video failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getVideosOfAObyekt(id) {
      try {
        this.isLoading = true
        this.error = null
        let res = await videos.getVideosOfAObyekt(id)
        this.isAuthenticated = true
        return res
      } catch (error) {
        this.error = error.message || 'Getting video failed'
        console.log(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
