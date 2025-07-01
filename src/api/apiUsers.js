import axiosClient from './apiClient'

const users = {
  loginUser(payload) {
    const url = 'users/login'
    return axiosClient.post(url, payload)
  },
}

export default users
