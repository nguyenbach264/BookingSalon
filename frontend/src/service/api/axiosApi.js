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

      // Nếu người dùng chưa từng đăng nhập hoặc session chưa khởi tạo, thử refresh token 1 lần ngầm
      try {
        const refreshed = await _authContext?.refreshToken?.();
        if (refreshed) {
          processQueue(null);
          return api(originalRequest);
        } else {
          throw new Error("Session expired");
        }
      } catch (refreshError) {
        processQueue(refreshError);
        // Mở modal đăng nhập kèm thông báo giống như ServicePage
        _authContext?.openLoginModal?.("Quý khách cần đăng nhập tài khoản để tiếp tục!");
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
