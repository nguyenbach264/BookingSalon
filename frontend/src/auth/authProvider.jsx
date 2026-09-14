import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { generateCodeVerifier, generateCodeChallenge, generateState } from "./pkce";

// Proactively purge any token and user keys from localStorage/sessionStorage
export const purgeBrowserTokens = () => {
  try {
    const keysToRemove = [
      "refresh_token", "access_token", "token", 
      "refreshToken", "accessToken",
      "bs_access_token", "bs_refresh_token",
      "jwt", "id_token",
      "bs_user", "user", "userInfo", "role",
      "bs_remembered_account"
    ];
    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch (e) {}
};

// Immediately purge on module load
purgeBrowserTokens();

// ── CONTEXT ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── PROVIDER ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ── KIỂM TRA PHIÊN ĐĂNG NHẬP BAN ĐẦU QUA SERVER SESSION (BFF) ───────────────
  useEffect(() => {
    let isMounted = true;

    const checkCurrentSession = async () => {
      purgeBrowserTokens();

      try {
        // Gửi cookie JSESSIONID lên BFF để kiểm tra phiên đăng nhập
        const res = await fetch("http://localhost:8080/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const user = await res.json();
          if (isMounted) {
            setUserInfo(user);
            setAuthenticated(true);
          }
        } else {
          if (isMounted) {
            setUserInfo(null);
            setAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn("Session check error or backend offline:", err);
        if (isMounted) {
          setUserInfo(null);
          setAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 1a. ĐĂNG NHẬP BẰNG AUTHORIZATION CODE FLOW + PKCE ──────────────────────
  const login = useCallback(async (arg1 = {}, password, rememberMe = false) => {
    // Nếu truyền username và password (dạng direct form call từ modal), sử dụng loginDirect
    if (typeof arg1 === "string" && typeof password === "string") {
      return loginDirect(arg1, password, rememberMe);
    }

    setLoading(true);
    setAuthError(null);
    try {
      let config = {
        authUrl: "http://localhost:8081/realms/booking-salon-realm/protocol/openid-connect/auth",
        clientId: "booking-salon-client",
      };

      try {
        const res = await fetch("http://localhost:8080/api/auth/oauth2/config", {
          credentials: "include",
        });
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

      const options = typeof arg1 === "object" && arg1 !== null ? arg1 : { loginHint: arg1 };
      if (options.idpHint) params.append("kc_idp_hint", options.idpHint);
      if (options.prompt) params.append("prompt", options.prompt);
      if (options.loginHint) params.append("login_hint", options.loginHint);

      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error("Error initiating Authorization Code Flow with PKCE:", error);
      setAuthError("Không thể khởi động luồng đăng nhập PKCE lúc này!");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 1b. ĐĂNG NHẬP TRỰC TIẾP (DIRECT ACCESS GRANT / MODAL FORM) ──────────────
  const loginDirect = useCallback(async (username, password, rememberMe = false) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Nhận cookie JSESSIONID từ server BFF
        body: JSON.stringify({ username, password, rememberMe }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
      }

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
        credentials: "include",
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
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã!");
      }

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

  // ── 4. ĐĂNG KÝ TRỰC TIẾP (FALLBACK) ─────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại. Vui lòng thử lại!");
      }
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
  const loginWithGoogle = useCallback(() => {
    return login({ idpHint: "google", prompt: "select_account" });
  }, [login]);

  // ── 6. XỬ LÝ CALLBACK TỪ OAUTH2 VÀ HOÀN TẤT TOKEN EXCHANGE BẰNG PKCE ────────
  const handleOAuth2Callback = useCallback(async (code, codeVerifier, redirectUri) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/oauth2/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Nhận và gán HttpOnly cookies
        body: JSON.stringify({ code, codeVerifier, redirectUri }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Xác thực tài khoản Google thất bại!");
      }

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

  // ── 7. LOGOUT ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setAuthenticated(false);
    setUserInfo(null);
    setAuthError(null);
    purgeBrowserTokens();

    // 1. Gọi backend để BFF xoá session server, thu hồi token tại Keycloak và xoá JSESSIONID
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Failed to logout at server", e);
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

  // ── 8. REFRESH TOKEN (BFF ĐÃ TỰ ĐỘNG REFRESH SERVER-SIDE) ───────────────────
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/refresh-token", {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // ── 9. QUÊN MẬT KHẨU: GỬI OTP ──────────────────────────────────────────────
  const sendForgotPasswordOtp = useCallback(async (email) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email!");
      }
      return { success: true, data };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra khi gửi mã xác thực!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 10. QUÊN MẬT KHẨU: XÁC THỰC OTP & ĐẶT LẠI MẬT KHẨU ──────────────────────
  const verifyAndResetPassword = useCallback(async ({ email, otp, newPassword }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/verify-and-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã OTP!");
      }
      return { success: true, data };
    } catch (error) {
      const message = error.message || "Có lỗi xảy ra khi đặt lại mật khẩu!";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Legacy helper cho axios interceptor (cookie tự động gửi qua withCredentials: true)
  const getToken = useCallback(() => null, []);

  return (
    <AuthContext.Provider
      value={{
        initialized,
        authenticated,
        userInfo,
        loading,
        authError,
        login,
        loginDirect,
        register,
        sendRegisterOtp,
        verifyOtpAndRegister,
        loginWithGoogle,
        handleOAuth2Callback,
        logout,
        refreshToken,
        getToken,
        sendForgotPasswordOtp,
        verifyAndResetPassword,
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
