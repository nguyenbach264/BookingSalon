/**
 * ==============================================================================
 * BẢNG ĐIỀU KHIỂN GIAO DIỆN & MÀU SẮC CHỦ ĐẠO TOÀN HỆ THỐNG BOOKINGSALON
 * ==============================================================================
 * 
 * BẠN CHỈ CẦN THAY ĐỔI MÃ MÀU DUY NHẤT TẠI FILE NÀY!
 * Toàn bộ Header, Navbar, Buttons, Ant Design components và các trang sẽ tự động đổi theo.
 */

export const THEME_CONFIG = {
  // Gam màu chủ đạo của toàn bộ ứng dụng (Default: #0099FF)
  primaryColor: '#0099FF',

  // Các biến thể tương ứng của màu chủ đạo
  primaryHover: '#0080d9',
  primaryActive: '#006bb3',
  primaryLight: '#e6f5ff',
  primaryFocusRing: 'rgba(0, 153, 255, 0.25)',

  // Màu chữ trên nền màu chủ đạo
  onPrimaryText: '#ffffff',

  // Font chữ gốc ban đầu của hệ thống
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * Hàm đồng bộ CSS Variables lên thẻ :root của trình duyệt
 * Đảm bảo Tailwind CSS và Native CSS lập tức cập nhật theo màu này tại thời gian thực.
 */
export const applyThemeToDocument = () => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', THEME_CONFIG.primaryColor);
    root.style.setProperty('--primary-hover', THEME_CONFIG.primaryHover);
    root.style.setProperty('--primary-active', THEME_CONFIG.primaryActive);
    root.style.setProperty('--primary-light', THEME_CONFIG.primaryLight);
    root.style.setProperty('--primary-ring', THEME_CONFIG.primaryFocusRing);
    root.style.setProperty('--font-main', THEME_CONFIG.fontFamily);
  }
};

export default THEME_CONFIG;
