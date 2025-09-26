import axiosClient from './apiClient'

const users = {
  loginUser(payload) {
    const url = 'users/login'
    return axiosClient.post(url, payload)
  },

  getUserInfo(id) {
    const url = `users/one/${id}`
    return axiosClient.get(url)
  },

  updateUserShaxsiyInfo(payload, id) {
    const url = `users/update/${id}`
    return axiosClient.patch(url, payload)
  },
}

export default users
