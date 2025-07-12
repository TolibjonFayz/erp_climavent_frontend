import axiosClient from './apiClient'

const videos = {
  createVideo(payload) {
    const url = 'location-videos/create'
    return axiosClient.post(url, payload)
  },
}

export default videos
