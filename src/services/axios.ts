import axios from "axios";
import jwt_decode from "jwt-decode";
import { useStore } from "../store/store";

const isDevelopment = __DEV__;

const baseURL = isDevelopment ? "http://192.168.1.15:3000/" : "https://biblophile.com/";

// Main axios instance
const instance = axios.create({
  baseURL,
});

// Separate instance for refresh token calls to avoid infinite loops
const refreshInstance = axios.create({
  baseURL,
});

interface DecodedToken {
  exp: number;
}

// Helper to check if token is expired or about to expire (within 60 seconds)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt_decode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp - currentTime < 60;
  } catch (e) {
    return true; // Treat decoding failure as "expired"
  }
};

// Track refresh state to prevent race conditions
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

// === Request Interceptor ===
instance.interceptors.request.use(
  async (config) => {
    const { userDetails, login, logout } = useStore.getState();
    const user = userDetails?.[0];

    if (user?.accessToken && user?.refreshToken) {
      const isExpiring = isTokenExpiringSoon(user.accessToken);

      if (isExpiring) {
        if (isRefreshing) {
          // If refresh is already in progress, queue this request
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              config.headers["Authorization"] = `Bearer ${token}`;
              resolve(config);
            });
          });
        }

        isRefreshing = true;

        try {
          const response = await refreshInstance.post(
            isDevelopment
              ? "api/v0/auth/refresh-token"
              : "backend/api/v0/auth/refresh-token",
            { refreshToken: user.refreshToken }
          );

          const data = response.data;

          if (data.data.message === 1 && data.data.accessToken) {
            const updatedUser = { ...user, accessToken: data.data.accessToken };
            login(updatedUser);

            config.headers["Authorization"] = `Bearer ${data.data.accessToken}`;
            onRefreshed(data.data.accessToken);
          } else {
            throw new Error("Invalid refresh response");
          }
        } catch (err) {
          console.error("Failed to refresh token proactively", err);
          logout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        config.headers["Authorization"] = `Bearer ${user.accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: keep response interceptor if backend sometimes sends 401 even if token looks valid
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { userDetails, login, logout } = useStore.getState();
      const refreshToken = userDetails?.[0]?.refreshToken;

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await refreshInstance.post(
          isDevelopment
            ? "api/v0/auth/refresh-token"
            : "backend/api/v0/auth/refresh-token",
          { refreshToken }
        );

        if (data.data.message === 1 && data.data.accessToken) {
          const updatedUser = { ...userDetails[0], accessToken: data.data.accessToken };
          await login(updatedUser);

          originalRequest.headers["Authorization"] = `Bearer ${data.data.accessToken}`;
          return instance(originalRequest);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (refreshError) {
        console.error("Token refresh failed after 401:", refreshError);
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;