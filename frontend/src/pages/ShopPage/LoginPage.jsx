import React, { useState, useEffect } from "react";
import { Checkbox, Input, Button, Modal, Form, Alert } from "antd";
import { useAuth } from "../../auth/authProvider";
import { useRoleRedirect } from "../../hooks/useRoleRedirect";

const LoginPage = ({ visible, onClose, onGoToRegister, onLoggedIn, notice, targetRedirect }) => {
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: input email, 2: input OTP + new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const [form] = Form.useForm();
  const [forgotEmailForm] = Form.useForm();
  const [forgotResetForm] = Form.useForm();

  const { login, loginWithGoogle, loading, authError, sendForgotPasswordOtp, verifyAndResetPassword } = useAuth();
  const redirectByRole = useRoleRedirect();

  // Đếm ngược 60 giây khi gửi OTP quên mật khẩu
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleLogin = async (values) => {
    const result = await login(values.identifier, values.password, values.rememberMe || false);
    if (result && result.success) {
      onClose();
      if (onLoggedIn) onLoggedIn(result.user);
      redirectByRole(result.user, targetRedirect);
    }
  };

  const handleSendForgotOtp = async (values) => {
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    const result = await sendForgotPasswordOtp(values.email);
    setForgotLoading(false);
    if (result.success) {
      setForgotEmail(values.email);
      setForgotStep(2);
      setCountdown(60);
      setForgotSuccess("Mã OTP đã được gửi đến email của bạn.");
    } else {
      setForgotError(result.error || "Không thể gửi mã OTP. Vui lòng kiểm tra lại email!");
    }
  };

  const handleResendForgotOtp = async () => {
    if (countdown > 0 || !forgotEmail) return;
    setForgotLoading(true);
    setForgotError(null);
    const result = await sendForgotPasswordOtp(forgotEmail);
    setForgotLoading(false);
    if (result.success) {
      setCountdown(60);
      setForgotSuccess("Mã OTP mới đã được gửi thành công!");
    } else {
      setForgotError(result.error || "Gửi lại OTP thất bại, vui lòng thử lại!");
    }
  };

  const handleResetPassword = async (values) => {
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    const result = await verifyAndResetPassword({
      email: forgotEmail,
      otp: values.otp,
      newPassword: values.newPassword,
    });
    setForgotLoading(false);
    if (result.success) {
      setForgotSuccess("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.");
      setTimeout(() => {
        setIsForgot(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotSuccess(null);
        forgotResetForm.resetFields();
        forgotEmailForm.resetFields();
      }, 2000);
    } else {
      setForgotError(result.error || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP!");
    }
  };

  const resetAllModals = () => {
    forgotEmailForm.resetFields();
    forgotResetForm.resetFields();
    setIsForgot(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotError(null);
    setForgotSuccess(null);
    setCountdown(0);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      className="rounded-2xl overflow-hidden"
      afterClose={resetAllModals}
    >
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-[#1b2a4a] tracking-wider">ĐĂNG NHẬP</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isForgot ? "Khôi phục mật khẩu tài khoản của bạn" : "Đăng nhập để trải nghiệm dịch vụ tốt nhất"}
          </p>
        </div>

        {notice && !isForgot && (
          <Alert message={notice} type="warning" showIcon className="mb-4 rounded-xl font-medium" />
        )}

        {authError && !isForgot && (
          <Alert message={authError} type="error" showIcon className="mb-4 rounded-xl" />
        )}

        {forgotError && isForgot && (
          <Alert message={forgotError} type="error" showIcon className="mb-4 rounded-xl" />
        )}

        {forgotSuccess && isForgot && (
          <Alert message={forgotSuccess} type="success" showIcon className="mb-4 rounded-xl" />
        )}

        {!isForgot ? (
          /* ================================================================ */
          /* FORM ĐĂNG NHẬP (CHUẨN AUTOFILL TRÌNH QUẢN LÝ MẬT KHẨU BROWSER)   */
          /* ================================================================ */
          <Form
            form={form}
            name="login"
            id="loginForm"
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="on"
          >
            <Form.Item
              label={<span className="font-semibold text-gray-700">Tên đăng nhập</span>}
              name="identifier"
              rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
              className="mb-3"
            >
              <Input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập..."
                size="large"
                className="rounded-xl h-11"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              className="mb-2"
            >
              <Input.Password
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu..."
                size="large"
                className="rounded-xl h-11"
              />
            </Form.Item>

            <div className="flex items-center justify-between text-sm mb-5">
              <Form.Item name="rememberMe" valuePropName="checked" noStyle initialValue={true}>
                <Checkbox className="text-gray-600">Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <span
                onClick={() => {
                  setIsForgot(true);
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-blue-600 hover:underline cursor-pointer font-medium"
              >
                Quên mật khẩu?
              </span>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl mb-4 shadow-sm"
            >
              ĐĂNG NHẬP
            </Button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs text-gray-400 uppercase font-semibold">Hoặc đăng nhập bằng</span>
            </div>

            {/* Nút Đăng nhập Google bằng Authorization Code Flow + PKCE */}
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-semibold text-gray-700 shadow-sm cursor-pointer mb-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.37 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.13 0 9.81 0 12s.43 3.87 1.18 5.38l4.09-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.63 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              Tiếp tục với Google
            </button>

            <div className="text-center mt-4 text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <span
                onClick={onGoToRegister}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </span>
            </div>
          </Form>
        ) : forgotStep === 1 ? (
          /* ================================================================ */
          /* FORM QUÊN MẬT KHẨU - BƯỚC 1: NHẬP EMAIL                           */
          /* ================================================================ */
          <Form form={forgotEmailForm} layout="vertical" onFinish={handleSendForgotOtp}>
            <Form.Item
              label={<span className="font-semibold text-gray-700">Email đã đăng ký</span>}
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ email!" },
                { type: "email", message: "Địa chỉ email không đúng định dạng!" }
              ]}
              className="mb-4"
            >
              <Input placeholder="Nhập địa chỉ email của bạn..." size="large" className="rounded-xl h-11" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={forgotLoading}
              disabled={countdown > 0}
              className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl mb-4 shadow-sm"
            >
              {countdown > 0 ? `GỬI LẠI SAU ${countdown}s` : "GỬI MÃ XÁC THỰC OTP"}
            </Button>

            <div className="text-center mt-2">
              <span
                onClick={() => {
                  setIsForgot(false);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-gray-600 hover:text-blue-600 cursor-pointer text-sm font-medium"
              >
                ← Quay lại đăng nhập
              </span>
            </div>
          </Form>
        ) : (
          /* ================================================================ */
          /* FORM QUÊN MẬT KHẨU - BƯỚC 2: NHẬP OTP & MẬT KHẨU MỚI             */
          /* ================================================================ */
          <Form form={forgotResetForm} layout="vertical" onFinish={handleResetPassword}>
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-xl mb-4 text-center">
              Mã xác thực OTP gồm 6 số đã được gửi tới <b>{forgotEmail}</b>. Vui lòng kiểm tra email của bạn.
            </div>

            <Form.Item
              label={<span className="font-semibold text-gray-700">Mã xác thực OTP (6 chữ số)</span>}
              name="otp"
              rules={[
                { required: true, message: "Vui lòng nhập mã OTP!" },
                { len: 6, message: "Mã OTP phải đúng 6 chữ số!" }
              ]}
              className="mb-3"
            >
              <Input
                placeholder="123456"
                maxLength={6}
                size="large"
                className="rounded-xl h-11 text-center tracking-widest font-mono text-lg font-bold"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-gray-700">Mật khẩu mới</span>}
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }
              ]}
              className="mb-3"
            >
              <Input.Password placeholder="Nhập mật khẩu mới..." size="large" className="rounded-xl h-11" />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-gray-700">Xác nhận mật khẩu mới</span>}
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận lại mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                  },
                }),
              ]}
              className="mb-4"
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới..." size="large" className="rounded-xl h-11" />
            </Form.Item>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                onClick={handleResendForgotOtp}
                disabled={countdown > 0 || forgotLoading}
                className="text-blue-600 font-semibold hover:underline disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã OTP"}
              </button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={forgotLoading}
              className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl mb-4 shadow-sm"
            >
              ĐẶT LẠI MẬT KHẨU
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span
                onClick={() => {
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-gray-600 hover:text-blue-600 cursor-pointer font-medium"
              >
                ← Đổi email khác
              </span>
              <span
                onClick={() => {
                  setIsForgot(false);
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-gray-600 hover:text-blue-600 cursor-pointer font-medium"
              >
                Đăng nhập
              </span>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default LoginPage;
