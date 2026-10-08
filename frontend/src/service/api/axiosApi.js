import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let _authContext = null;
export function injectAuthContext(authContext) {
  _authContext = authContext;
}

api.interceptors.request.use(
  (config) => {
    const token = _authContext?.getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        if (!isDashboard && isInitialized && _authContext?.openLoginModal) {
          _authContext.openLoginModal("Phiên đăng nhập của quý khách đã hết hạn. Vui lòng đăng nhập lại để tiếp tục!");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
