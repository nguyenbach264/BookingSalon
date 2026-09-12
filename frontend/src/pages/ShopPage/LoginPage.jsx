import React, { useState } from "react";
import { Checkbox, Input, Button, Modal, Form, Alert } from "antd";
import { useAuth } from "../../auth/authProvider";

const LoginPage = ({ visible, onClose, onGoToRegister, onLoggedIn }) => {
  const [isForgot, setIsForgot] = useState(false);
  const [form] = Form.useForm();
  const { login, loginWithGoogle, loginWithKeycloak, loading, authError } = useAuth();

  const handleLogin = async (values) => {
    const result = await login(values.identifier, values.password);
    if (result.success) {
      form.resetFields();
      onClose();
      if (onLoggedIn) onLoggedIn(result.user);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      scrollLock={false}
      className="rounded-2xl overflow-hidden"
      destroyOnClose
      afterClose={() => {
        form.resetFields();
        setIsForgot(false);
      }}
    >
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-[#1b2a4a] tracking-wider">30SHINE SHOP</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isForgot ? "Khôi phục mật khẩu tài khoản của bạn" : "Đăng nhập để trải nghiệm dịch vụ tốt nhất"}
          </p>
        </div>

        {authError && !isForgot && (
          <Alert message={authError} type="error" showIcon className="mb-4 rounded-xl" />
        )}

        {!isForgot ? (
          <Form form={form} layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label={<span className="font-semibold text-gray-700">Tên đăng nhập</span>}
              name="identifier"
              rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
              className="mb-3"
            >
              <Input placeholder="Nhập tên đăng nhập..." size="large" className="rounded-xl h-11" />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              className="mb-2"
            >
              <Input.Password placeholder="Nhập mật khẩu..." size="large" className="rounded-xl h-11" />
            </Form.Item>

            <div className="flex items-center justify-between text-sm mb-5">
              <Checkbox className="text-gray-600">Ghi nhớ đăng nhập</Checkbox>
              <span
                onClick={() => setIsForgot(true)}
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

            {/* Nut Dang nhap Google bang Authorization Code Flow + PKCE */}
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

            {/* Nut Keycloak SSO tuy chon */}
            <button
              type="button"
              onClick={loginWithKeycloak}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-[#1b2a4a] py-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Đăng nhập bằng tài khoản Keycloak SSO
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
        ) : (
          <Form layout="vertical">
            <Form.Item label="Nhập Email hoặc Số điện thoại đã đăng ký" name="resetEmail" className="mb-4">
              <Input placeholder="Email hoặc SĐT..." size="large" className="rounded-xl h-11" />
            </Form.Item>
            <Button type="primary" className="w-full h-12 bg-[#1b2a4a] hover:bg-[#244383] font-bold text-base rounded-xl">
              GỬI MÃ XÁC NHẬN
            </Button>
            <div className="text-center mt-4">
              <span
                onClick={() => setIsForgot(false)}
                className="text-gray-600 hover:text-blue-600 cursor-pointer text-sm font-medium"
              >
                ← Quay lại đăng nhập
              </span>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default LoginPage;