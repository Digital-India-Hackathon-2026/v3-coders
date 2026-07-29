import axios from "axios";

export const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://kisanseeva-backend.onrender.com/api";
  }
  return "http://localhost:5000/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
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

// Response interceptor: auto-clear session on 401 (expired token) or 403 (wrong role)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Token expired or invalid — force re-login
      localStorage.removeItem("token");
      window.location.href = "/login?reason=session_expired";
    } else if (status === 403) {
      // Wrong role token — clear and redirect with message
      const currentRole = error.config?.url || "";
      const isBookingRoute = currentRole.includes("/bookings");
      if (isBookingRoute) {
        // Let the component handle this with a better UI message
        // Don't auto-redirect so the user sees the inline error
      }
    }
    return Promise.reject(error);
  }
);

export default API;

