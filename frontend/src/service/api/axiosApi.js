import axios from "axios";
import { message } from "antd";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let _authContext = null;
export function injectAuthContext(authContext) {
  _authContext = authContext;
}

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

api.interceptors.request.use(
  (config) => {
    const token = _authContext?.getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Gửi CSRF token từ XSRF-TOKEN cookie nếu có
    const xsrfToken = getCookie("XSRF-TOKEN");
    if (xsrfToken) {
      config.headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Thử refresh token ngầm — BFF sẽ dùng refresh token từ server-side session
      try {
        const refreshed = await _authContext?.refreshToken?.();
        if (refreshed) {
          processQueue(null);
          return api(originalRequest);
        }
        // Nếu refresh thất bại, thử thêm 1 lần sau delay ngắn (tránh race condition khi session vừa khởi tạo)
        await new Promise(resolve => setTimeout(resolve, 600));
        const retried = await _authContext?.refreshToken?.();
        if (retried) {
          processQueue(null);
          return api(originalRequest);
        }
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
      } catch (refreshError) {
        processQueue(refreshError);
        // Chỉ mở modal đăng nhập với trang khách hàng, không làm gián đoạn dashboard của Admin/Stylist
        const isDashboard = typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/stylist"));
        // Chỉ mở modal nếu auth context đã initialized (tránh flash modal khi trang vừa load)
        const isInitialized = _authContext?.initialized !== false;
        const isAuthLoading = _authContext?.loading === true;
        if (!isDashboard && isInitialized && !isAuthLoading && _authContext?.openLoginModal) {
          _authContext.openLoginModal("Phiên đăng nhập của quý khách đã hết hạn. Vui lòng đăng nhập lại để tiếp tục!");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.["retry-after"] || error.response.data?.retryAfterSeconds || 60;
      const warningMsg = error.response.data?.message || `Quý khách đang thao tác quá nhanh! Vui lòng chờ ${retryAfter} giây rồi thử lại.`;
      try {
        message.warning({
          content: warningMsg,
          key: "rate-limit-warning",
          duration: 4,
        });
      } catch (e) {
        console.warn("Rate limit warning:", warningMsg);
      }
    }

    if (error.response?.status === 403) {
      console.error("Access denied:", error.response.data?.message);
    }
    if (error.response?.status >= 500) {
      console.error("Server error:", error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;
