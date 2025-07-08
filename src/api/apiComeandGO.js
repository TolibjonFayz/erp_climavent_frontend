import axiosClient from './apiClient'

const comeandgoes = {
  createComeAndGo(payload) {
    const url = 'come-and-goes/create'
    return axiosClient.post(url, payload)
  },
}

export default comeandgoes
