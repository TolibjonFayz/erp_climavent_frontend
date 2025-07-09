import axiosClient from './apiClient'

const comeandgoes = {
  createComeAndGo(payload) {
    const url = 'come-and-goes/create'
    return axiosClient.post(url, payload)
  },
  getAllComeAndGoesOfUser(id) {
    const url = `come-and-goes/user/${id}`
    return axiosClient.get(url)
  },
  getComeAndGoById(id) {
    const url = `come-and-goes/one/${id}`
    return axiosClient.get(url)
  },
  updateComeAndGoById(payload, id) {
    const url = `come-and-goes/update/${id}`
    return axiosClient.patch(url, payload)
  },
}

export default comeandgoes
