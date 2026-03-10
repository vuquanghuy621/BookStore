import axiosClient from "./axiosClient";

const chatbotApi = {
    chat(message) {
        const url = '/chatbot';
        return axiosClient.post(url, { message });
    }
}

export default chatbotApi;
