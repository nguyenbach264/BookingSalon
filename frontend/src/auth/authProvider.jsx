import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "./pkce";

// ── AUTH STORAGE HELPERS ──────────────────────────────────────────────────────
const TOKEN_KEY = "bs_access_token";
const REFRESH_KEY = "bs_refresh_token";
const USER_KEY = "bs_user";

const storage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
  },
  setSession: (accessToken, refreshToken, user) => {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

// ── CONTEXT ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── PROVIDER ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const refreshingRef = useRef(false);
  const refreshSubscribersRef = useRef([]);

  useEffect(() => {
    const token = storage.getToken();
    const user = storage.getUser();
    if (token && user) {
      setAuthenticated(true);
      setUserInfo(user);
    }
    setInitialized(true);
  }, []);

  // ── 1. ĐĂNG NHẬP TRỰC TIẾP (USERNAME & PASSWORD TẠI MODAL) ─────────────────
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
      }
      storage.setSession(data.accessToken, data.refreshToken, data.user);
      setUserInfo(data.user);
      setAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra, vui lòng thử lại!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 2. GỬI MÃ OTP ĐĂNG KÝ QUA EMAIL (RATE-LIMITED 60s) ──────────────────────
  const sendRegisterOtp = useCallback(async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Không thể gửi mã OTP, vui lòng thử lại!");
      }
      return { success: true, data: resData };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra khi gửi mã OTP!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 3. XÁC THỰC OTP VÀ HOÀN TẤT ĐĂNG KÝ TÀI KHOẢN ──────────────────────────
  const verifyOtpAndRegister = useCallback(async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã!");
      }

      storage.setSession(resData.accessToken, resData.refreshToken, resData.user);
      setUserInfo(resData.user);
      setAuthenticated(true);
      return { success: true, user: resData.user };
    } catch (error) {
      const message = error.message || "Xác thực mã OTP thất bại!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 4. ĐĂNG KÝ TRỰC TIẾP (FALLBACK KHÔNG QUA OTP NẾU CẦN) ───────────────────
  const register = useCallback(async (formData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại. Vui lòng thử lại!");
      }
      storage.setSession(data.accessToken, data.refreshToken, data.user);
      setUserInfo(data.user);
      setAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra, vui lòng thử lại!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 5. ĐĂNG NHẬP GOOGLE BẰNG AUTHORIZATION CODE FLOW + PKCE ────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      // Lấy thông tin cấu hình OAuth2 từ Backend
      let config = {
        authUrl: "http://localhost:8081/realms/booking-salon-realm/protocol/openid-connect/auth",
        clientId: "booking-salon-client",
        googleConfigured: true,
      };

      try {
        const res = await fetch("http://localhost:8080/api/auth/oauth2/config");
        if (res.ok) {
          config = await res.json();
        }
      } catch (e) {
        console.warn("Could not fetch OAuth2 config, using default", e);
      }

      if (config.googleConfigured === false && config.googleEnabled === false) {
        setAuthError("Google Identity Provider chưa được kích hoạt trong hệ thống! Vui lòng cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET.");
        return;
      }

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();
      const redirectUri = window.location.origin + "/oauth2/callback";

      sessionStorage.setItem("oauth_code_verifier", codeVerifier);
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_redirect_after", window.location.pathname + window.location.search);

      const params = new URLSearchParams({
        client_id: config.clientId || "booking-salon-client",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: state,
        kc_idp_hint: "google", // Yeu cau Keycloak chuyen tiep thang toi Google Login
        prompt: "select_account", // Bat buoc Google va Keycloak hien thi hop thoai chon tai khoan
      });

      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error("Error initiating Google login with PKCE:", error);
      setAuthError("Không thể khởi động đăng nhập Google lúc này!");
    }
  }, []);

  // ── 6. ĐĂNG NHẬP KEYCLOAK SSO BẰNG AUTHORIZATION CODE FLOW + PKCE ──────────
  const loginWithKeycloak = useCallback(async () => {
    try {
      let config = {
        authUrl: "http://localhost:8081/realms/booking-salon-realm/protocol/openid-connect/auth",
        clientId: "booking-salon-client",
      };

      try {
        const res = await fetch("http://localhost:8080/api/auth/oauth2/config");
        if (res.ok) {
          config = await res.json();
        }
      } catch (e) {
        console.warn("Could not fetch OAuth2 config, using default", e);
      }

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();
      const redirectUri = window.location.origin + "/oauth2/callback";

      sessionStorage.setItem("oauth_code_verifier", codeVerifier);
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_redirect_after", window.location.pathname + window.location.search);

      const params = new URLSearchParams({
        client_id: config.clientId || "booking-salon-client",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: state,
      });

      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error("Error initiating Keycloak SSO login with PKCE:", error);
      setAuthError("Không thể khởi động đăng nhập Keycloak SSO!");
    }
  }, []);

  // ── 7. XỬ LÝ CALLBACK TỪ OAUTH2 VÀ HOÀN TẤT TOKEN EXCHANGE BẰNG PKCE ────────
  const handleOAuth2Callback = useCallback(async (code, codeVerifier, redirectUri) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/oauth2/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier, redirectUri }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Xác thực tài khoản Google thất bại!");
      }

      storage.setSession(data.accessToken, data.refreshToken, data.user);
      setUserInfo(data.user);
      setAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra khi xử lý xác thực!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 8. LOGOUT ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const storedRefreshToken = storage.getRefreshToken();
    const user = storage.getUser();
    const token = storage.getToken();
    const keycloakId = user?.keycloakId || user?.id;

    storage.clearSession();
    setAuthenticated(false);
    setUserInfo(null);
    setAuthError(null);

    // 1. Gọi backend để revoke refresh token VÀ kết thúc toàn bộ active sessions của user trên Keycloak DB
    if (storedRefreshToken || keycloakId) {
      fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          refreshToken: storedRefreshToken,
          keycloakId: keycloakId,
        }),
      }).catch((e) => console.warn("Failed to revoke session at server", e));
    }

    // 2. Kích hoạt OIDC front-channel logout để xoá session cookie tại Keycloak (localhost:8081)
    try {
      const oidcLogoutUrl = `http://localhost:8081/realms/booking-salon-realm/protocol/openid-connect/logout?client_id=booking-salon-client&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
      const img = new Image();
      img.src = oidcLogoutUrl;
    } catch (e) {
      console.warn("Front-channel logout ping error", e);
    }
  }, []);

  // ── 9. REFRESH TOKEN TỰ ĐỘNG ───────────────────────────────────────────────
  const refreshToken = useCallback(async () => {
    if (refreshingRef.current) {
      return new Promise((resolve, reject) => {
        refreshSubscribersRef.current.push({ resolve, reject });
      });
    }
    refreshingRef.current = true;
    const storedRefreshToken = storage.getRefreshToken();
    if (!storedRefreshToken) {
      refreshingRef.current = false;
      logout();
      return Promise.reject(new Error("No refresh token"));
    }
    try {
      const response = await fetch("http://localhost:8080/api/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      if (!response.ok) throw new Error("Refresh token expired");
      const data = await response.json();
      storage.setSession(data.accessToken, data.refreshToken, data.user ?? userInfo);
      if (data.user) setUserInfo(data.user);
      refreshSubscribersRef.current.forEach(({ resolve }) => resolve(data.accessToken));
      refreshSubscribersRef.current = [];
      return data.accessToken;
    } catch (error) {
      refreshSubscribersRef.current.forEach(({ reject }) => reject(error));
      refreshSubscribersRef.current = [];
      logout();
      return Promise.reject(error);
    } finally {
      refreshingRef.current = false;
    }
  }, [userInfo, logout]);

  const getToken = useCallback(() => storage.getToken(), []);

  return (
    <AuthContext.Provider
      value={{
        initialized,
        authenticated,
        userInfo,
        loading,
        authError,
        login,
        register,
        sendRegisterOtp,
        verifyOtpAndRegister,
        loginWithGoogle,
        loginWithKeycloak,
        handleOAuth2Callback,
        logout,
        refreshToken,
        getToken,
      }}
    >
      {initialized ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}