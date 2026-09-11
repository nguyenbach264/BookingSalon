import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, Alert, Button } from "antd";
import { useAuth } from "../../auth/authProvider";

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuth2Callback } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setErrorMessage(errorDescription || error || "Đăng nhập bị hủy hoặc từ chối.");
        setLoading(false);
        return;
      }

      if (!code) {
        setErrorMessage("Không nhận được mã xác thực Authorization Code từ hệ thống.");
        setLoading(false);
        return;
      }

      const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
      const redirectUri = window.location.origin + "/oauth2/callback";
      const redirectAfter = sessionStorage.getItem("oauth_redirect_after") || "/";

      if (!codeVerifier) {
        setErrorMessage("Không tìm thấy mã bảo mật PKCE (code_verifier). Vui lòng đăng nhập lại!");
        setLoading(false);
        return;
      }

      try {
        const result = await handleOAuth2Callback(code, codeVerifier, redirectUri);
        if (result.success) {
          sessionStorage.removeItem("oauth_code_verifier");
          sessionStorage.removeItem("oauth_redirect_after");
          navigate(redirectAfter, { replace: true });
        } else {
          setErrorMessage(result.error || "Xác thực tài khoản thất bại!");
          setLoading(false);
        }
      } catch (err) {
        setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình xử lý đăng nhập.");
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, handleOAuth2Callback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <h2 className="text-2xl font-black text-[#1b2a4a] mb-2 tracking-wide">30SHINE SALON</h2>
        
        {loading ? (
          <div className="py-8">
            <Spin size="large" />
            <p className="mt-4 text-base font-semibold text-gray-700">
              Đang xác thực đăng nhập Google...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Vui lòng không đóng hoặc tải lại trang này.
            </p>
          </div>
        ) : (
          <div className="py-4">
            <Alert
              message="Đăng nhập không thành công"
              description={errorMessage}
              type="error"
              showIcon
              className="text-left mb-6 rounded-xl"
            />
            <Button
              type="primary"
              onClick={() => navigate("/", { replace: true })}
              className="w-full h-11 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl"
            >
              VỀ TRANG CHỦ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}