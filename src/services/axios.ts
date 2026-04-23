import axios from "axios";
import jwt_decode from "jwt-decode";
import { useStore } from "../store/store";

const isDevelopment = __DEV__;
const baseURL = isDevelopment ? "http://192.168.10.8:3000/" : "https://biblophile.com/";

const instance = axios.create({ baseURL });
const refreshInstance = axios.create({ baseURL });

interface DecodedToken {
  exp: number;
}

const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt_decode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp - currentTime < 60;
  } catch (e) {
    return true;
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach(cb => cb(null));
  refreshSubscribers = [];
};

// === Request Interceptor ===
instance.interceptors.request.use(
  async (config) => {
    const { userDetails, login, logout } = useStore.getState();
    const user = userDetails?.[0];

    if (!user?.accessToken || !user?.refreshToken) {
      return config;
    }

    const isExpiring = isTokenExpiringSoon(user.accessToken);

    if (!isExpiring) {
      config.headers["Authorization"] = `Bearer ${user.accessToken}`;
      return config;
    }

    // Token is expiring — need to refresh
    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            // Refresh failed — let the request through with the old token
            // The response interceptor will handle the 401 if it comes
            config.headers["Authorization"] = `Bearer ${user.accessToken}`;
          } else {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
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
        const newToken = data.data.accessToken;
        const updatedUser = { ...user, accessToken: newToken };
        login(updatedUser);
        config.headers["Authorization"] = `Bearer ${newToken}`;
        onRefreshed(newToken);
        return config;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (err) {
      const isNetworkError = !err.response; // No response = network issue, not auth failure

      if (isNetworkError) {
        // Don't logout — just proceed with the existing token
        // The server will return 401 if it's truly expired,
        // and the response interceptor will handle it
        console.warn("Token refresh failed due to network error, proceeding with existing token");
        config.headers["Authorization"] = `Bearer ${user.accessToken}`;
        onRefreshFailed(err);
        return config;
      } else {
        // Server explicitly rejected the refresh (400, 403, etc.) — auth is truly invalid
        console.error("Token refresh rejected by server, logging out", err);
        onRefreshFailed(err);
        logout();
        return Promise.reject(err);
      }
    } finally {
      isRefreshing = false;
    }
  },
  (error) => Promise.reject(error)
);

// === Response Interceptor ===
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry on 401, and only once
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const { userDetails, login, logout } = useStore.getState();
    const user = userDetails?.[0];

    if (!user?.refreshToken) {
      logout();
      return Promise.reject(error);
    }

    // If a refresh is already happening (from request interceptor), wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) return reject(error);
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          resolve(instance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await refreshInstance.post(
        isDevelopment
          ? "api/v0/auth/refresh-token"
          : "backend/api/v0/auth/refresh-token",
        { refreshToken: user.refreshToken }
      );

      if (data.data.message === 1 && data.data.accessToken) {
        const newToken = data.data.accessToken;
        login({ ...user, accessToken: newToken });
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        onRefreshed(newToken);
        return instance(originalRequest);
      } else {
        throw new Error("Refresh failed");
      }
    } catch (refreshError) {
      const isNetworkError = !refreshError.response;

      if (isNetworkError) {
        // Network is down — don't logout, just fail this request
        console.warn("Token refresh failed due to network error on 401 retry");
        onRefreshFailed(refreshError);
        return Promise.reject(error); // reject with original error
      }

      // Server rejected refresh — truly logged out
      console.error("Token refresh rejected after 401, logging out");
      onRefreshFailed(refreshError);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;