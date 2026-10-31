import { useNavigate } from "react-router-dom";

/**
 * Trả về đường dẫn trang phù hợp dựa trên role của user.
 *
 * @param {string|null|undefined} role - Role của user: "ADMIN", "STYLIST", "USER", v.v.
 * @returns {string} - Đường dẫn redirect
 */
export function getRedirectPathByRole(role) {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin/dashboard";
    case "STYLIST":
      return "/stylist/dashboard";
    case "USER":
    default:
      return "/";
  }
}

/**
 * Hook tiện ích để redirect người dùng đến trang phù hợp sau khi đăng nhập thành công.
 *
 * Sử dụng:
 *   const redirectByRole = useRoleRedirect();
 *   redirectByRole(user);  // user là object có trường .role
 *
 * @returns {function(user: object): void}
 */
export function useRoleRedirect() {
  const navigate = useNavigate();

  return (user, targetPath = null) => {
    const roleUpper = user?.role?.toUpperCase();
    if (roleUpper === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (roleUpper === "STYLIST") {
      navigate("/stylist/dashboard", { replace: true });
      return;
    }
    if (targetPath) {
      navigate(targetPath, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };
}

