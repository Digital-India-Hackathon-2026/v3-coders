import axios from "axios";

const API = axios.create({
  baseURL: `http://${window.location.hostname}:5000/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically add JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
