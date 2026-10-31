import React, { useState } from "react";
import { Input, Button, Modal, Form, Alert } from "antd";
import { useAuth } from "../../auth/authProvider";
import OtpVerificationModal from "./OtpVerificationModal";

const RegisterPage = ({ visible, onClose, onLogin, onRegistered }) => {
  const [form] = Form.useForm();
  const { sendRegisterOtp, loginWithGoogle, loading, authError } = useAuth();

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (values) => {
    setErrorMessage("");

    const regData = {
      username: values.username.trim(),
      password: values.password,
      email: values.email.trim(),
      fullName: values.fullname.trim(),
      phoneNumber: values.phone.trim(),
    };

    // Gui OTP qua email kem rate-limit 60s
    const result = await sendRegisterOtp({
      email: regData.email,
      username: regData.username,
      phoneNumber: regData.phoneNumber,
    });

    if (result.success) {
      setPendingData(regData);
      setOtpModalVisible(true);
    } else {
      setErrorMessage(result.error || "Không thể gửi mã OTP, vui lòng thử lại!");
    }
  };

  const handleOtpSuccess = (user) => {
    setOtpModalVisible(false);
    form.resetFields();
    onClose();
    if (onRegistered) onRegistered(user);
  };

  return (
    <>
      <Modal
        open={visible && !otpModalVisible}
        onCancel={onClose}
        footer={null}
        width={620}
        centered
        className="rounded-2xl overflow-hidden"
        destroyOnClose
        afterClose={() => {
          form.resetFields();
          setErrorMessage("");
        }}
      >
        <div className="p-5 sm:p-7 text-center">
          <h2 className="text-2xl font-black text-[#1b2a4a] mb-1 tracking-wide">ĐĂNG KÝ TÀI KHOẢN</h2>
          <p className="text-gray-500 text-sm mb-6">Điền thông tin để nhận mã xác thực OTP qua Email</p>

          {(errorMessage || authError) && (
            <Alert
              message={errorMessage || authError}
              type="error"
              showIcon
              className="mb-5 text-left rounded-xl"
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* Hàng 1: Họ tên & Tên đăng nhập */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              <Form.Item
                name="fullname"
                label={<span className="font-semibold text-gray-700">Họ và tên</span>}
                rules={[{ required: true, message: "Vui lòng nhập Họ và tên!" }]}
                className="mb-3 text-left"
              >
                <Input size="large" placeholder="Ví dụ: Nguyễn Văn A" className="rounded-xl h-11" />
              </Form.Item>

              <Form.Item
                name="username"
                label={<span className="font-semibold text-gray-700">Tên đăng nhập</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập Tên đăng nhập!" },
                  { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
                ]}
                className="mb-3 text-left"
              >
                <Input size="large" placeholder="Nhập tên tài khoản..." className="rounded-xl h-11" />
              </Form.Item>
            </div>

            {/* Hàng 2: Số điện thoại & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              <Form.Item
                name="phone"
                label={<span className="font-semibold text-gray-700">Số điện thoại</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập Số điện thoại!" },
                  { pattern: /^0[3-9]\d{8}$/, message: "Số điện thoại không hợp lệ (10 số)!" },
                ]}
                className="mb-3 text-left"
              >
                <Input size="large" placeholder="0901234567" className="rounded-xl h-11" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="font-semibold text-gray-700">Địa chỉ Email</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập Email!" },
                  { type: "email", message: "Định dạng Email không hợp lệ!" },
                ]}
                className="mb-3 text-left"
              >
                <Input size="large" placeholder="email@domain.com" className="rounded-xl h-11" />
              </Form.Item>
            </div>

            {/* Hàng 3: Mật khẩu & Xác nhận mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              <Form.Item
                name="password"
                label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập Mật khẩu!" },
                  { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
                ]}
                className="mb-3 text-left"
              >
                <Input.Password size="large" placeholder="Tối thiểu 8 ký tự..." className="rounded-xl h-11" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span className="font-semibold text-gray-700">Xác nhận mật khẩu</span>}
                dependencies={['password']}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
                className="mb-4 text-left"
              >
                <Input.Password size="large" placeholder="Nhập lại mật khẩu..." className="rounded-xl h-11" />
              </Form.Item>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-[#1b2a4a] hover:bg-[#244383] h-12 text-base font-bold rounded-xl mb-3 shadow-sm"
            >
              TIẾP TỤC & NHẬN MÃ OTP
            </Button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs text-gray-400 uppercase font-semibold">Hoặc đăng ký nhanh bằng</span>
            </div>

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
              Đăng ký qua Google
            </button>

            <div className="mt-4 text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <span
                className="text-blue-600 font-bold hover:underline cursor-pointer"
                onClick={() => {
                  form.resetFields();
                  onLogin();
                }}
              >
                Đăng nhập ngay
              </span>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal xac thuc ma OTP */}
      {pendingData && (
        <OtpVerificationModal
          visible={otpModalVisible}
          onClose={() => setOtpModalVisible(false)}
          email={pendingData.email}
          registrationData={pendingData}
          onSuccess={handleOtpSuccess}
        />
      )}
    </>
  );
};

export default RegisterPage;