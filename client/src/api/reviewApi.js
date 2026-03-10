import axiosClient from "./axiosClient";

const reviewApi = {
    create: (params) => {
        const url = '/reviews';
        return axiosClient.post(url, params);
    },
    getByBookId: (bookId) => {
        const url = `/reviews/book/${bookId}`;
        return axiosClient.get(url);
    },
}

export default reviewApi;
