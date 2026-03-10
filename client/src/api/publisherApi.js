import axiosClient from "./axiosClient"

const publisherApi = {

    getAll: ({page, limit}) => {
        const url = 'publishers/'
        return axiosClient.get(url, { params: {page, limit}})
    },  
    getById: (id) => {
        const url = `publishers/${id}`
        return axiosClient.get(url)
    },
    update: (id, data) => {
        const url = `publishers/${id}`
        return axiosClient.put(url, data)
    },
    create: (data) => {
        const url = `publishers/`
        return axiosClient.post(url, data)
    },
    delete: (id) => {
        const url = `publishers/${id}`
        return axiosClient.delete(url)
    }
}

export default publisherApi