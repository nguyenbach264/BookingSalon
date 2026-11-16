import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES = {
  "/": "BachBarber - Chuỗi Salon Tóc Nam & Chăm Sóc Toàn Diện",
  "/service": "Dịch vụ tóc nam & Combo chăm sóc | BachBarber",
  "/shop": "Shop Mỹ phẩm & Phụ kiện tóc nam chính hãng | BachBarber Store",
  "/booking": "Đặt lịch hẹn giữ chỗ | BachBarber",
  "/booking/select-salon": "Chọn chi nhánh Salon | Đặt lịch BachBarber",
  "/booking/select-stylist-and-date": "Chọn Stylist & Giờ hẹn | Đặt lịch BachBarber",
  "/booking/select-service": "Chọn dịch vụ làm đẹp | Đặt lịch BachBarber",
  "/booking/checkout": "Xác nhận lịch hẹn | BachBarber",
  "/booking/checkout-successfully": "Đặt lịch thành công | BachBarber",
  "/profile": "Hồ sơ cá nhân & Tài khoản | BachBarber",
  "/my-bookings": "Lịch sử đặt hẹn của tôi | BachBarber",
  "/my-orders": "Lịch sử mua hàng | BachBarber Store",
  "/checkout": "Thanh toán đơn hàng | BachBarber Store",
  "/payment/result": "Kết quả thanh toán giao dịch | BachBarber",
  "/notification_detail": "Thông báo hệ thống | BachBarber",
  "/admin/dashboard": "Quản trị hệ thống (Admin Dashboard) | BachBarber",
  "/stylist/dashboard": "Bảng điều khiển Stylist | BachBarber",
  "/unauthorized": "Truy cập bị từ chối (403) | BachBarber",
  "/error": "Lỗi hệ thống | BachBarber",
};

export default function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    // Check exact match
    if (ROUTE_TITLES[pathname]) {
      document.title = ROUTE_TITLES[pathname];
      return;
    }

    // Prefix matches for nested routes
    if (pathname.startsWith("/admin")) {
      document.title = "Quản trị hệ thống (Admin Dashboard) | BachBarber";
      return;
    }

    if (pathname.startsWith("/stylist")) {
      document.title = "Bảng điều khiển Stylist | BachBarber";
      return;
    }

    if (pathname.startsWith("/booking")) {
      document.title = "Đặt lịch cắt tóc & làm đẹp | BachBarber";
      return;
    }

    if (pathname.startsWith("/shop/product/")) {
      // Dynamic product title is set within ProductDetailPage.jsx; provide fallback here
      document.title = "Chi tiết sản phẩm | BachBarber Store";
      return;
    }

    // Default fallback
    document.title = "BachBarber - Chuỗi Salon Tóc Nam & Chăm Sóc Toàn Diện";
  }, [location.pathname]);

  return null;
}

