import axios from "axios";

const BASE_URL = "https://almight-backend.herokuapp.com"

export const projectAxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const authAxiosInstance = axios.create({
    baseURL: BASE_URL + "/auth",
    withCredentials: true
})