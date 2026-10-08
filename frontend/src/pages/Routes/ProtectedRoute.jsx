import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authProvider";
import AuthRequiredNotice from "../components/AuthRequiredNotice";

/**
 * ProtectedRoute — Bảo vệ route theo authentication và role.
 *
 * Props:
 *   children    — component cần bảo vệ
 *   roles       — mảng role được phép truy cập, ví dụ ["ADMIN", "STYLIST"]
 *                 Nếu không truyền → chỉ cần đăng nhập là được
 *   redirectTo  — URL redirect khi không có quyền (mặc định: "/")
 */
export default function ProtectedRoute({ children, roles, redirectTo = "/" }) {
  const { authenticated, userInfo, initialized, openLoginModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (initialized && !authenticated) {
      openLoginModal("Quý khách cần đăng nhập tài khoản để tiếp tục!", location.pathname);
    }
  }, [initialized, authenticated, location.pathname, openLoginModal]);

  // Chờ AuthProvider khởi tạo xong
  if (!initialized) return null;

  // Chưa đăng nhập → Hiển thị giao diện thông báo yêu cầu đăng nhập rõ ràng + nút đăng nhập
  if (!authenticated) {
    return <AuthRequiredNotice />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (roles && roles.length > 0) {
    const userRole = userInfo?.role;
    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

