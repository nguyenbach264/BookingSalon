import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authProvider";

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
  const { authenticated, userInfo, initialized } = useAuth();
  const location = useLocation();

  // Chờ AuthProvider khởi tạo xong
  if (!initialized) return null;

  // Chưa đăng nhập → redirect về trang hiện tại để user có thể login
  if (!authenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
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

