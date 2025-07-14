import axiosClient from './apiClient'

const videos = {
  createVideo(payload) {
    const url = 'location-videos/create'
    return axiosClient.post(url, payload)
  },

  getVideosOfAObyekt(id) {
    const url = `location-videos/one/${id}`
    return axiosClient.get(url)
  },
}

export default videos
