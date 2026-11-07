import React from "react";
import { Button, Result } from "antd";
import { LockOutlined, LoginOutlined, HomeOutlined, UserAddOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authProvider";

/**
 * AuthRequiredNotice — Hiển thị thông báo yêu cầu đăng nhập rõ ràng thay vì silent redirect
 */
export default function AuthRequiredNotice({
  title = "Yêu cầu đăng nhập",
  subtitle = "Quý khách cần đăng nhập tài khoản để thực hiện đặt lịch dịch vụ hoặc quản lý tài khoản.",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLoginModal, openRegisterModal } = useAuth();

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center">
        {/* Animated icon circle */}
        <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm text-3xl">
          <LockOutlined />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 uppercase tracking-wide">
          {title}
        </h2>

        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
          {subtitle}
        </p>

        {/* Benefits reminder */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-left mb-6 text-xs sm:text-sm text-gray-700 space-y-2">
          <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <span>✨</span> Quyền lợi khi đăng nhập:
          </p>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Đặt lịch nhanh chóng, chọn stylist và khung giờ ưu tiên</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Theo dõi trạng thái: Chờ xác nhận, Đã đặt, Hoàn tất dịch vụ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Áp dụng mã giảm giá và voucher độc quyền</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() =>
              openLoginModal(
                "Vui lòng đăng nhập để tiếp tục đặt lịch hẹn!",
                location.pathname
              )
            }
            className="bg-[#1b2a4a] hover:bg-[#244383] font-bold h-12 px-6 rounded-xl flex-1 shadow-sm"
          >
            Đăng nhập ngay
          </Button>

          <Button
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => openRegisterModal()}
            className="font-semibold h-12 px-6 rounded-xl flex-1 border-gray-300 hover:border-[#1b2a4a] hover:text-[#1b2a4a]"
          >
            Đăng ký mới
          </Button>
        </div>

        <div className="mt-4">
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-700 text-xs"
          >
            Quay lại Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

