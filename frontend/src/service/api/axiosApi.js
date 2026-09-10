import axios from "axios";
import keycloak from "../../auth/keycloak";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        // Kiểm tra access token
        // Nếu token còn hạn dưới 30s thì Keycloak sẽ refresh
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error("Cannot refresh access token", error);
        await keycloak.logout();
        return Promise.reject(error);
      }
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

export default api;