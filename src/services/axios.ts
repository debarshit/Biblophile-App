import axios from "axios";

/* base url to make requests to biblophile actions api. Turn it to spadeleaf actions later */
const instance = axios.create({
    baseURL: "https://biblophile.com/",
});

export default instance;