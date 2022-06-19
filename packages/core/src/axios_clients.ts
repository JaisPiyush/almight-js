import axios from "axios";


function getBaseUrl(): string {
    if (process.env["NODE_ENV"] !== undefined &&
        process.env["NODE_ENV"] === "development" && process.env["BACKEND_BASE_URL"] !== undefined) {
        return process.env["BACKEND_BASE_URL"];
    }
    return "https://almight-backend.herokuapp.com"
}

const BASE_URL = getBaseUrl();

export const projectAxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const authAxiosInstance = axios.create({
    baseURL: BASE_URL + "/auth",
    withCredentials: true
})