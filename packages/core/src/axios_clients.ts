import axios from "axios";

const BASE_URL = process.env.BACKEND_BASE_URL

export const projectAxiosInstance = axios.create({
    baseURL: BASE_URL
});

export const authAxiosInstance = axios.create({
    baseURL: BASE_URL + "/auth",
    withCredentials: true
})