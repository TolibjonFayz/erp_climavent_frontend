import axiosClient from './apiClient'

const comeandgoInside = {
  createComeAndGoInside(payload) {
    const url = 'come-and-go-inside/create'
    return axiosClient.post(url, payload)
  },

  getAllComeAndGoInside() {
    const url = 'come-and-go-inside/all'
    return axiosClient.get(url)
  },

  getComeAndGoInsideById(id) {
    const url = `come-and-go-inside/one/${id}`
    return axiosClient.get(url)
  },

  updateComeAndGoInsideById(payload, id) {
    const url = `come-and-go-inside/update/${id}`
    return axiosClient.patch(url, payload)
  },
}

export default comeandgoInside
