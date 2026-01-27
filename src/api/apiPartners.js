import axiosClient from './apiClient'

const partners = {
  createPartner(payload) {
    const url = 'partners/create'
    return axiosClient.post(url, payload)
  },

  getAllPartners() {
    const url = `partners/all`
    return axiosClient.get(url)
  },

  getALLPartnersOfAUser(id) {
    const url = `partners/userall/${id}`
    return axiosClient.get(url)
  },

  getOnePartner(id) {
    const url = `partners/one/${id}`
    return axiosClient.get(url)
  },

  updateOnePartner(id, payload) {
    const url = `partners/update/${id}`
    return axiosClient.patch(url, payload)
  },

  deleteOnePartner(id) {
    const url = `partners/delete/${id}`
    return axiosClient.delete(url)
  },
}

export default partners
