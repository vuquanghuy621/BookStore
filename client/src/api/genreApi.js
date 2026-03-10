import axiosClient from "./axiosClient"

const genreApi = {

    getAll: ({page, limit}) => {
        const url = 'genres/'
        return axiosClient.get(url, { params: {page, limit}})
    },
    getBySlug: (slug) => {
        const url = `genres/slug/${slug}`
        return axiosClient.get(url)
    },
    getById: (id) => {
        const url = `genres/${id}`
        return axiosClient.get(url)
    },
    update: (id, data) => {
        const url = `genres/${id}`
        return axiosClient.put(url, data)
    },
    create: (data) => {
        const url = `genres/`
        return axiosClient.post(url, data)
    },
    delete: (id) => {
        const url = `genres/${id}`
        return axiosClient.delete(url)
    }
}

export default genreApi