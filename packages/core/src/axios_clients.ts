import axios from "axios";

const BASE_URL = "http://localhost:8000"

export const projectAxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const authAxiosInstance = axios.create({
    baseURL: BASE_URL + "/auth",
    withCredentials: true
})