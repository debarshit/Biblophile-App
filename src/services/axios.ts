import axios from "axios";

const isDevelopment = __DEV__;

// Axios instance with base URL depending on environment
const instance = axios.create({
    baseURL: isDevelopment ? "http://localhost:3000/" : "https://biblophile.com/",
});

export default instance;