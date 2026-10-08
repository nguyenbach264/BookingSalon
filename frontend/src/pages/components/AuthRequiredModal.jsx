import React from "react";
import { Modal, Button } from "antd";
import { LockOutlined, LoginOutlined, UserAddOutlined } from "@ant-design/icons";

/**
 * AuthRequiredModal - Modal thông báo yêu cầu đăng nhập khi khách hàng thực hiện Đặt lịch
 */
export default function AuthRequiredModal({
  visible,
  onClose,
  onLogin,
  onRegister,
  title = "YÊU CẦU ĐĂNG NHẬP",
  message = "Quý khách cần đăng nhập tài khoản để thực hiện chức năng Đặt lịch cắt tóc tại BachBarber.",
}) {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      className="auth-required-modal"
    >
      <div className="py-4 px-2 text-center">
        {/* Icon & Badge */}
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner text-2xl">
          <LockOutlined />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-800 tracking-wide mb-2 uppercase">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Feature Highlights */}
        <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left border border-gray-100 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Xem và quản lý lịch hẹn 24/7 theo thời gian thực</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Tích lũy voucher ưu đãi và quà tặng thành viên</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Chọn stylist yêu thích và dịch vụ tận tâm</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => {
              onClose();
              if (onLogin) onLogin();
            }}
            className="w-full bg-[#1b2a4a] hover:bg-[#244383] font-bold h-11 rounded-xl shadow-sm"
          >
            ĐĂNG NHẬP NGAY
          </Button>

          <Button
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => {
              onClose();
              if (onRegister) onRegister();
            }}
            className="w-full font-semibold h-11 rounded-xl border-gray-300 hover:border-[#1b2a4a] hover:text-[#1b2a4a]"
          >
            TẠO TÀI KHOẢN MỚI
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 py-1"
          >
            Để sau, tôi sẽ đăng nhập sau
          </button>
        </div>
      </div>
    </Modal>
  );
}

